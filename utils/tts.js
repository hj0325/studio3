// TTS 관련 상태 관리를 위한 전역 변수 (단순화됨)
let currentAudio = null;
let currentUtterance = null;
let isSpeaking = false;
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
 * 간단하고 안정적인 Google Cloud TTS 오디오 재생
 * @param {string} audioBase64 - Base64 인코딩된 오디오 데이터
 * @returns {Promise<boolean>} - 성공 여부
 */
const playGoogleTTS = async (audioBase64) => {
  try {
    // Base64를 직접 Audio 객체에서 재생 (간단한 방법)
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // 오디오 재생
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = 1.0; // 최대 볼륨
    currentAudio.preload = 'auto'; // 자동 프리로드
    
    isSpeaking = true;
    
    return new Promise((resolve) => {
      currentAudio.onloadeddata = () => {
        console.log('✅ Google Cloud TTS 오디오 로드 완료');
      };

      currentAudio.onended = () => {
        isSpeaking = false;
        console.log('✅ Google Cloud TTS 재생 완료');
        resolve(true);
      };

      currentAudio.onerror = (error) => {
        isSpeaking = false;
        console.log('❌ Google Cloud TTS 재생 오류:', error);
        resolve(false);
      };

      currentAudio.play().then(() => {
        console.log('🎵 Google Cloud TTS 재생 시작');
      }).catch((error) => {
        isSpeaking = false;
        console.log('❌ Google Cloud TTS 재생 실패:', error);
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
 * 현재 재생 중인 음성 중지 (단순화됨)
 */
export const stopSpeaking = () => {
  return new Promise(async (resolve) => {
    console.log('🔇 모든 음성 중지 시도');
    
    // 1. HTML5 Audio 중지
    if (currentAudio) {
      console.log('- HTML5 Audio 중지');
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = ''; // 리소스 해제
      currentAudio = null;
    }

    // 2. 브라우저 TTS 중지
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
/**
 * 간단하고 안정적인 Base64 오디오 재생 (에코 효과 제거)
 * @param {string} audioBase64 - Base64 인코딩된 오디오 데이터
 * @returns {Promise} - 재생 완료 Promise
 */
const playBase64Audio = (audioBase64) => {
  return new Promise((resolve, reject) => {
    try {
      // 간단한 data URL 방식 사용 (최고 호환성)
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      
      // 오디오 설정
      audio.volume = 1.0;
      audio.preload = 'auto';
      
      // 현재 오디오로 설정
      currentAudio = audio;
      isSpeaking = true;
      
      audio.onloadeddata = () => {
        console.log('🎭 Google Cloud TTS 오디오 로드 완료');
      };
      
      audio.onplay = () => {
        console.log('🎭 Google Cloud TTS (Vaya) 자연스러운 재생 시작');
      };
      
      audio.onended = () => {
        console.log('✅ Google Cloud TTS (Vaya) 자연스러운 재생 완료');
        currentAudio = null;
        isSpeaking = false;
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('🔥 Google Cloud TTS 오디오 재생 오류:', error);
        currentAudio = null;
        isSpeaking = false;
        reject(error);
      };
      
      // 재생 시작
      audio.play().catch((error) => {
        console.error('🔥 오디오 재생 시작 실패:', error);
        currentAudio = null;
        isSpeaking = false;
        reject(error);
      });
      
    } catch (error) {
      console.error('🔥 Base64 오디오 처리 오류:', error);
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