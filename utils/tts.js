// TTS 관련 상태 관리를 위한 전역 변수
let currentAudio = null;
let currentUtterance = null;
let isSpeaking = false;
let currentAudioContext = null;
let currentAudioSource = null;
let lastProcessedText = null; // 중복 처리 방지

/**
 * Google Cloud TTS를 우선 사용하고, 실패 시 브라우저 TTS를 사용
 * @param {string} text - 읽을 텍스트
 * @returns {Promise<boolean>} - 성공 여부
 */
export const speakText = async (text) => {
  if (!text || text.trim() === '') {
    console.warn('⚠️ 빈 텍스트는 읽을 수 없음');
    return;
  }

  const trimmedText = text.trim();
  
  // 🎯 중복 처리 방지: 같은 텍스트는 무시
  if (lastProcessedText === trimmedText) {
    console.log('⚠️ 동일한 텍스트 중복 요청 무시:', trimmedText.slice(0, 30) + '...');
    return;
  }

  console.log('🎭 TTS 시작:', trimmedText.slice(0, 50) + '...');
  lastProcessedText = trimmedText; // 현재 처리 중인 텍스트 저장

  try {
    // 기존 음성 강제 중지 (중요!)
    console.log('🔇 새 TTS 시작 전 모든 음성 중지');
    stopSpeaking();
    
    // 중지 완료를 위한 충분한 대기 (Web Audio API 완전 중지)
    await new Promise(resolve => setTimeout(resolve, 200));

    // 1. Google Cloud TTS (Charon) 시도
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.audioContent && data.source === 'google-cloud-tts') {
        console.log('✅ Google Cloud TTS 응답 받음:', data.voice);
        await playBase64Audio(data.audioContent);
        return;
      }
    }
    
    console.log('🔄 Google Cloud TTS 실패, Vaya 스타일 브라우저 TTS로 전환');
    
  } catch (error) {
    console.error('🔥 Google Cloud TTS API 호출 오류:', error);
    console.log('🔄 Vaya 스타일 브라우저 TTS로 전환');
  }

  // 2. Vaya 스타일 브라우저 TTS fallback
  try {
    await speakWithBrowserTTS(text);
  } catch (error) {
    console.error('🔥 Vaya 스타일 브라우저 TTS도 실패:', error);
    throw error;
  }
};

/**
 * Google Cloud TTS 오디오 재생
 * @param {string} audioBase64 - Base64 인코딩된 오디오 데이터
 * @returns {Promise<boolean>} - 성공 여부
 */
const playGoogleTTS = async (audioBase64) => {
  try {
    // Base64 오디오 데이터를 Blob으로 변환
    const audioBytes = atob(audioBase64);
    const audioArray = new Uint8Array(audioBytes.length);
    
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i);
    }

    const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    // 오디오 재생
    currentAudio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      currentAudio.onended = () => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        console.log('✅ Google Cloud TTS 재생 완료');
        resolve(true);
      };

      currentAudio.onerror = () => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        console.log('❌ Google Cloud TTS 재생 오류');
        resolve(false);
      };

      currentAudio.play().catch(() => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        console.log('❌ Google Cloud TTS 재생 실패');
        resolve(false);
      });
    });

  } catch (error) {
    console.error('Google TTS 재생 오류:', error);
    isSpeaking = false;
    return false;
  }
};

/**
 * 브라우저 내장 TTS를 사용하는 fallback 함수
 * @param {string} text - 읽을 텍스트
 * @returns {Promise<boolean>} - 성공 여부
 */
const playBrowserTTS = async (text) => {
  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      // 사용 가능한 음성 목록 가져오기
      const voices = speechSynthesis.getVoices();
      
      // 텍스트 언어 감지
      const detectLanguage = (text) => {
        const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        return koreanRegex.test(text) ? 'ko-KR' : 'en-US';
      };

      const detectedLanguage = detectLanguage(text);
      console.log('🌍 playBrowserTTS 언어 감지:', detectedLanguage);

      let selectedVoice = null;
      
      if (detectedLanguage === 'ko-KR') {
        // 한국어 음성 우선순위
        const koreanVoices = [
          'Microsoft Heami',
          'Microsoft SunHi', 
          'Google 한국의',
          'Yuna',
          'Sora'
        ];
        
        for (const koreanName of koreanVoices) {
          selectedVoice = voices.find(voice => 
            voice.name.includes(koreanName) && voice.lang.includes('ko')
          );
          if (selectedVoice) break;
        }
        
        // 대안: 한국어 음성 아무거나
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('ko') || voice.lang.includes('KR')
          );
        }
      } else {
        // 영어 Charon 스타일 음성 우선순위
        const englishVoices = [
          'Microsoft David',
          'Microsoft Mark', 
          'Alex',
          'Daniel',
          'Fred'
        ];
        
        for (const englishName of englishVoices) {
          selectedVoice = voices.find(voice => 
            voice.name.includes(englishName) && voice.lang.includes('en')
          );
          if (selectedVoice) break;
        }
        
        // 대안: 영어 남성 음성
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en') &&
            (voice.name.toLowerCase().includes('male') || 
             voice.name.toLowerCase().includes('man') ||
             voice.name.toLowerCase().includes('david') ||
             voice.name.toLowerCase().includes('alex'))
          );
        }
        
        // 최종 대안: 영어 음성 아무거나
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en-')
          );
        }
      }
      
      // 음성 설정
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎭 Charon 스타일 음성 선택:', selectedVoice.name, selectedVoice.lang);
      } else {
        console.log('🔊 브라우저 TTS - 기본 음성 사용');
      }
      
      // 기본 음성 설정 사용
      utterance.lang = selectedVoice ? selectedVoice.lang : 'en-US';
      
      // 이벤트 핸들러 설정
      utterance.onstart = () => {
        isSpeaking = true;
        console.log('🎭 Charon 음성 시작');
      };

      utterance.onend = () => {
        isSpeaking = false;
        currentUtterance = null;
        console.log('🎭 Charon 음성 완료');
        resolve(true);
      };

      utterance.onerror = (event) => {
        isSpeaking = false;
        currentUtterance = null;
        console.error('🎭 Charon 음성 오류:', event.error);
        resolve(false);
      };

      // 현재 utterance 저장
      currentUtterance = utterance;
      
      // 음성 재생
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('브라우저 TTS 오류:', error);
      isSpeaking = false;
      resolve(false);
    }
  });
};

/**
 * 현재 재생 중인 음성 중지
 */
export const stopSpeaking = () => {
  return new Promise(async (resolve) => {
    console.log('🔇 모든 음성 중지 시도');
    
    // 1. Web Audio API 중지
    if (currentAudioContext) {
      console.log('- Web Audio Context 중지');
      await currentAudioContext.close().catch(console.error);
      currentAudioContext = null;
    }
    
    if (currentAudioSource) {
      console.log('- Audio Source 중지');
      try {
        currentAudioSource.stop();
      } catch (e) {
        console.log('- Audio Source 이미 중지됨');
      }
      currentAudioSource = null;
    }

    // 2. HTML5 Audio 중지
    if (currentAudio) {
      console.log('- HTML5 Audio 중지');
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = ''; // 리소스 해제
      currentAudio = null;
    }

    // 3. 브라우저 TTS 중지
    if (window.speechSynthesis) {
      console.log('- 브라우저 TTS 중지');
      window.speechSynthesis.cancel();
      // 완전한 중지를 위한 추가 대기
      await new Promise(r => setTimeout(r, 50));
    }

    if (currentUtterance) {
      console.log('- 현재 Utterance 중지');
      currentUtterance = null;
    }

    // 상태 초기화
    isSpeaking = false;
    lastProcessedText = null;
    
    // 모든 중지 작업이 완료될 때까지 짧게 대기
    await new Promise(r => setTimeout(r, 50));
    
    console.log('✅ 모든 음성 중지 완료');
    resolve();
  });
};

/**
 * TTS 재생 상태 확인
 * @returns {boolean} - 재생 중 여부
 */
export const getIsSpeaking = () => {
  return isSpeaking;
};

// Base64 오디오 재생 함수 (에코 효과 적용)
const playBase64Audio = (audioBase64) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Base64를 Blob으로 변환
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
      
      // Web Audio API를 사용한 에코 효과
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(URL.createObjectURL(audioBlob));
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // 전역 변수에 저장 (중지를 위해)
        currentAudioContext = audioContext;
        currentAudioSource = source;

        // 🎭 에코 효과용 Delay Node (아주 살짝만)
        const delay = audioContext.createDelay();
        delay.delayTime.value = 0.15; // 0.15초 (살짝 짧은 메아리)

        // 🎭 에코 강도 조절용 Gain Node (아주 약하게)
        const feedback = audioContext.createGain();
        feedback.gain.value = 0.1; // 더 약한 메아리

        // 🎭 에코 볼륨 조절 (기본 목소리보다 훨씬 작게)
        const echoGain = audioContext.createGain();
        echoGain.gain.value = 0.3; // 에코는 원본의 30% 볼륨

        // 🎭 원본 음성 볼륨 조절
        const mainGain = audioContext.createGain();
        mainGain.gain.value = 0.9; // 원본 음성

        // 🎭 에코 루프 연결
        delay.connect(feedback);
        feedback.connect(delay);

        // 🎭 오디오 경로 연결 (딜레이 없는 원본 + 낮은 볼륨 에코)
        source.connect(mainGain); // 원본: 딜레이 없이 바로 재생
        source.connect(delay); // 에코: 딜레이 후 재생
        
        mainGain.connect(audioContext.destination); // 원본 음성 (딜레이 없음)
        delay.connect(echoGain); // 에코에 볼륨 조절 적용
        echoGain.connect(audioContext.destination); // 에코 음성 (낮은 볼륨)

        // 상태 설정
        currentAudio = { 
          pause: () => source.stop(),
          currentTime: 0,
          src: URL.createObjectURL(audioBlob)
        };
        isSpeaking = true;

        console.log('🎭 Google Cloud TTS (Vaya) + 최적화된 에코 효과 재생 시작 (에코 30% 볼륨)');

        source.onended = () => {
          console.log('✅ Google Cloud TTS (Vaya) + 최적화된 에코 효과 재생 완료');
          URL.revokeObjectURL(audioBlob);
          currentAudio = null;
          currentAudioContext = null;
          currentAudioSource = null;
          isSpeaking = false;
          resolve();
        };

        source.start();

      } catch (webAudioError) {
        console.warn('⚠️ Web Audio API 실패, 일반 오디오로 재생:', webAudioError);
        
        // Web Audio API 실패 시 일반 Audio 객체 사용
        const audio = new Audio(URL.createObjectURL(audioBlob));
        
        // 현재 오디오로 설정
        currentAudio = audio;
        isSpeaking = true;
        
        audio.onloadeddata = () => {
          console.log('🎭 Google Cloud TTS 오디오 로드 완료');
        };
        
        audio.onplay = () => {
          console.log('🎭 Google Cloud TTS (Vaya) 재생 시작');
        };
        
        audio.onended = () => {
          console.log('✅ Google Cloud TTS (Vaya) 재생 완료');
          URL.revokeObjectURL(audio.src);
          currentAudio = null;
          isSpeaking = false;
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('🔥 Google Cloud TTS 오디오 재생 오류:', error);
          URL.revokeObjectURL(audio.src);
          currentAudio = null;
          isSpeaking = false;
          reject(error);
        };
        
        audio.play().catch((error) => {
          currentAudio = null;
          isSpeaking = false;
          reject(error);
        });
      }
      
    } catch (error) {
      console.error('🔥 Base64 오디오 변환 오류:', error);
      reject(error);
    }
  });
};

// Charon 스타일 브라우저 TTS
const speakWithBrowserTTS = (text) => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      console.error('🔥 브라우저가 TTS를 지원하지 않음');
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // 기존 음성 중지
    stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    
    // Charon 스타일 음성 설정 찾기
    const voices = window.speechSynthesis.getVoices();
    console.log('🎭 사용 가능한 음성들:', voices.map(v => `${v.name} (${v.lang})`));
    
    // 텍스트 언어 감지
    const detectLanguage = (text) => {
      const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
      return koreanRegex.test(text) ? 'ko-KR' : 'en-US';
    };

    const detectedLanguage = detectLanguage(text);
    console.log('🌍 브라우저 TTS 언어 감지:', detectedLanguage);

    let selectedVoice = null;
    
    if (detectedLanguage === 'ko-KR') {
      // 한국어 남성 음성 우선순위 (바야 스타일)
      const koreanMalePreferences = [
        'Microsoft Heami',    // 한국어 남성 음성
        'Microsoft SunHi',    // 한국어 남성 음성
        'Google 한국의',
        'Yuna',
        'Sora'
      ];
      
      for (const preference of koreanMalePreferences) {
        selectedVoice = voices.find(voice => 
          voice.name.includes(preference) && voice.lang.includes('ko')
        );
        if (selectedVoice) break;
      }
      
      // 대안1: 한국어 남성 음성 찾기
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          (voice.lang.includes('ko') || voice.lang.includes('KR')) &&
          voice.name.toLowerCase().includes('male')
        );
      }
      
      // 대안2: 한국어 음성 아무거나
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('ko') || voice.lang.includes('KR')
        );
      }
    } else {
      // 영어 Charon 스타일 음성 우선순위
      const charonPreferences = [
        'Microsoft David',
        'Alex',
        'Daniel', 
        'Fred'
      ];
      
      for (const preference of charonPreferences) {
        selectedVoice = voices.find(voice => 
          voice.name.includes(preference) && voice.lang.includes('en')
        );
        if (selectedVoice) break;
      }
      
      // 대안: 영어 남성 음성
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en') && 
          (voice.name.toLowerCase().includes('male') || 
           voice.name.toLowerCase().includes('man') ||
           voice.name.includes('David') || 
           voice.name.includes('Alex'))
        );
      }
    }
    
    // 최종 대안: 기본 음성
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🎭 Vaya 스타일 음성 선택:', selectedVoice.name);
    }
    
    // 🎭 Vaya 스타일 음성 설정 (낮고 천천히)
    utterance.rate = 0.75;  // 천천히 말하기
    utterance.pitch = 0.3;  // 낮은 음성 (남성적)
    utterance.volume = 1.0; // 최대 볼륨
    
    console.log('🎭 Vaya 스타일 브라우저 TTS 설정:', {
      voice: selectedVoice?.name || '기본 음성',
      rate: utterance.rate,
      pitch: utterance.pitch,
      volume: utterance.volume
    });
    
    utterance.onstart = () => {
      console.log('🎭 Vaya 스타일 브라우저 TTS 시작');
      isSpeaking = true;
    };
    
    utterance.onend = () => {
      console.log('✅ Vaya 스타일 브라우저 TTS 완료');
      currentUtterance = null;
      isSpeaking = false;
      resolve();
    };
    
    utterance.onerror = (error) => {
      console.error('🔥 Vaya 스타일 브라우저 TTS 오류:', error);
      currentUtterance = null;
      isSpeaking = false;
      reject(error);
    };
    
    // 음성 목록이 로드되지 않았을 수 있으므로 잠시 대기
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  });
}; 