// TTS 관련 상태 관리를 위한 전역 변수
let currentAudio = null;
let isSpeaking = false;

/**
 * Google Cloud TTS를 사용하여 텍스트를 음성으로 변환하고 재생
 * @param {string} text - 읽을 텍스트
 * @returns {Promise<boolean>} - 성공 여부
 */
export const speakText = async (text) => {
  try {
    // 기존 음성 중지
    stopSpeaking();

    if (!text || text.trim() === '') {
      return false;
    }

    console.log('TTS 요청:', text);
    isSpeaking = true;

    // Google TTS API 호출
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.fallback) {
        console.log('Google TTS 실패, 브라우저 TTS로 fallback');
        return fallbackTTS(text);
      }
      throw new Error(data.error || 'TTS API 오류');
    }

    // Base64 오디오 데이터를 Blob으로 변환
    const audioBytes = atob(data.audioContent);
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
        console.log('TTS 재생 완료');
        resolve(true);
      };

      currentAudio.onerror = () => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        console.log('TTS 재생 오류, fallback 시도');
        fallbackTTS(text).then(resolve);
      };

      currentAudio.play().catch(() => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        console.log('TTS 재생 실패, fallback 시도');
        fallbackTTS(text).then(resolve);
      });
    });

  } catch (error) {
    console.error('TTS 오류:', error);
    isSpeaking = false;
    // Fallback으로 브라우저 TTS 사용
    return fallbackTTS(text);
  }
};

/**
 * 브라우저 내장 TTS를 사용하는 fallback 함수
 * @param {string} text - 읽을 텍스트
 * @returns {Promise<boolean>} - 성공 여부
 */
const fallbackTTS = (text) => {
  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.8;
      utterance.pitch = 0.3;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        isSpeaking = true;
      };

      utterance.onend = () => {
        isSpeaking = false;
        resolve(true);
      };

      utterance.onerror = () => {
        isSpeaking = false;
        resolve(false);
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Fallback TTS 오류:', error);
      isSpeaking = false;
      resolve(false);
    }
  });
};

/**
 * 현재 재생 중인 음성 중지
 */
export const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  speechSynthesis.cancel();
  isSpeaking = false;
};

/**
 * TTS 재생 상태 확인
 * @returns {boolean} - 재생 중 여부
 */
export const getIsSpeaking = () => {
  return isSpeaking;
}; 