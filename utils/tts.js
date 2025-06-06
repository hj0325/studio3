// TTS 관련 상태 관리를 위한 전역 변수
let currentAudio = null;
let currentUtterance = null;
let isSpeaking = false;

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

  console.log('🎭 TTS 시작:', text.trim());

  try {
    // 기존 음성 중지
    stopSpeaking();

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
    
    console.log('🔄 Google Cloud TTS 실패, Charon 스타일 브라우저 TTS로 전환');
    
  } catch (error) {
    console.error('🔥 Google Cloud TTS API 호출 오류:', error);
    console.log('🔄 Charon 스타일 브라우저 TTS로 전환');
  }

  // 2. Charon 스타일 브라우저 TTS fallback
  try {
    await speakWithBrowserTTS(text);
  } catch (error) {
    console.error('🔥 Charon 스타일 브라우저 TTS도 실패:', error);
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
  console.log('🔇 TTS 중지');
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentUtterance) {
    currentUtterance = null;
  }
};

/**
 * TTS 재생 상태 확인
 * @returns {boolean} - 재생 중 여부
 */
export const getIsSpeaking = () => {
  return isSpeaking;
};

// Base64 오디오 재생 함수
const playBase64Audio = (audioBase64) => {
  return new Promise((resolve, reject) => {
    try {
      // Base64를 Blob으로 변환
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
      
      // Audio 객체 생성 및 재생
      const audio = new Audio(URL.createObjectURL(audioBlob));
      
      audio.onloadeddata = () => {
        console.log('🎭 Google Cloud TTS 오디오 로드 완료');
      };
      
      audio.onplay = () => {
        console.log('🎭 Google Cloud TTS (Charon) 재생 시작');
      };
      
      audio.onended = () => {
        console.log('✅ Google Cloud TTS (Charon) 재생 완료');
        URL.revokeObjectURL(audio.src);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('🔥 Google Cloud TTS 오디오 재생 오류:', error);
        URL.revokeObjectURL(audio.src);
        reject(error);
      };
      
      audio.play().catch(reject);
      
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
      // 한국어 음성 우선순위
      const koreanPreferences = [
        'Microsoft Heami',
        'Microsoft SunHi', 
        'Google 한국의',
        'Yuna',
        'Sora'
      ];
      
      for (const preference of koreanPreferences) {
        selectedVoice = voices.find(voice => 
          voice.name.includes(preference) && voice.lang.includes('ko')
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
      console.log('🎭 Charon 스타일 음성 선택:', selectedVoice.name);
    }
    
    console.log('🎭 Charon 스타일 브라우저 TTS 설정:', {
      voice: selectedVoice?.name || '기본 음성'
    });
    
    utterance.onstart = () => {
      console.log('🎭 Charon 스타일 브라우저 TTS 시작');
    };
    
    utterance.onend = () => {
      console.log('✅ Charon 스타일 브라우저 TTS 완료');
      currentUtterance = null;
      resolve();
    };
    
    utterance.onerror = (error) => {
      console.error('🔥 Charon 스타일 브라우저 TTS 오류:', error);
      currentUtterance = null;
      reject(error);
    };
    
    // 음성 목록이 로드되지 않았을 수 있으므로 잠시 대기
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  });
}; 