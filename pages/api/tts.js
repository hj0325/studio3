const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    console.log('🎭 Google Cloud TTS (Charon) 시작:', text.trim());

    // 서비스 계정 키 파일 경로
    const keyFilePath = path.join(process.cwd(), 'pages', 'api', 'vaya-voice-9a75a34cc232.json');
    
    // Google Cloud Text-to-Speech 클라이언트 초기화
    const client = new TextToSpeechClient({
      keyFilename: keyFilePath,
      projectId: 'vaya-voice'
    });

    // 텍스트 언어 감지 함수
    const detectLanguage = (text) => {
      const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
      return koreanRegex.test(text) ? 'ko-KR' : 'en-US';
    };

    const detectedLanguage = detectLanguage(text.trim());
    console.log('🌍 감지된 언어:', detectedLanguage);

    // Charon 음성 설정 (언어별 최적화)
    const voiceConfig = detectedLanguage === 'ko-KR' ? {
      languageCode: 'ko-KR',
      name: 'ko-KR-Neural2-C', // 한국어 남성 음성
      ssmlGender: 'MALE'
    } : {
      languageCode: 'en-US', 
      name: 'en-US-Neural2-D', // 영어 남성 음성 (Charon 스타일)
      ssmlGender: 'MALE'
    };

    const request = {
      input: { text: text.trim() },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        effectsProfileId: ['headphone-class-device'], // 헤드폰 최적화
        // Turn coverage와 Affective dialog 기능 활성화
        enableTimePointing: true
      }
    };

    console.log('🎭 Charon 음성 요청:', {
      voice: request.voice.name,
      language: request.voice.languageCode
    });

    // Google Cloud TTS API 호출
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    // Base64로 인코딩
    const audioBase64 = response.audioContent.toString('base64');
    
    const voiceName = detectedLanguage === 'ko-KR' ? 
      'Charon (ko-KR-Neural2-C)' : 
      'Charon (en-US-Neural2-D)';
    
    console.log('✅ Google Cloud TTS (Charon) 성공!');
    
    res.status(200).json({ 
      audioContent: audioBase64,
      contentType: 'audio/mpeg',
      source: 'google-cloud-tts',
      voice: voiceName,
      language: detectedLanguage
    });

  } catch (error) {
    console.error('🔥 Google Cloud TTS (Charon) 오류:', error.message);
    
    // Google TTS 실패 시 브라우저 TTS fallback
    return res.status(500).json({ 
      error: 'Google Cloud TTS failed', 
      fallback: true,
      details: error.message 
    });
  }
} 