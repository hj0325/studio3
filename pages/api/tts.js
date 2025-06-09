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
    const trimmedText = text.trim();
    console.log('🎭 Google Cloud TTS (Vaya) 시작:', {
      text: trimmedText.slice(0, 50) + '...',
      length: trimmedText.length,
      timestamp: new Date().toISOString()
    });

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

    // Vaya 음성 설정 (더 낮고 성숙한 음성)
    const voiceConfig = detectedLanguage === 'ko-KR' ? {
      languageCode: 'ko-KR',
      name: 'ko-KR-Neural2-C', // 한국어 남성 음성 (가장 낮은 톤)
      ssmlGender: 'MALE'
    } : {
      languageCode: 'en-US', 
      name: 'en-US-Neural2-A', // 영어 남성 음성 (더 깊고 성숙한 목소리)
      ssmlGender: 'MALE'
    };

    // SSML로 더 낮고 섬세한 목소리 만들기
    const ssmlText = `<speak>
      <prosody pitch="-4st">
        ${text.trim()}
      </prosody>
    </speak>`;

    const request = {
      input: { ssml: ssmlText },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        effectsProfileId: ['headphone-class-device'], // 헤드폰 최적화
        // 더 낮고 성숙한 음성을 위한 설정
        pitch: -5.0, // 음성을 더 낮게
        speakingRate: 0.85, // 조금 더 천천히 말하기
        enableTimePointing: true
      }
    };

    console.log('🎭 Vaya 음성 요청 (SSML + 에코):', {
      voice: request.voice.name,
      language: request.voice.languageCode,
      pitch: request.audioConfig.pitch,
      speakingRate: request.audioConfig.speakingRate,
      ssml: 'prosody pitch="-4st" (기본 속도)'
    });

    // Google Cloud TTS API 호출
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    // Base64로 인코딩
    const audioBase64 = response.audioContent.toString('base64');
    
    const voiceName = detectedLanguage === 'ko-KR' ? 
      'Vaya (ko-KR-Neural2-C, SSML + 에코)' : 
      'Vaya (en-US-Neural2-A, SSML + 에코)';
    
    console.log('✅ Google Cloud TTS (Vaya) + SSML + 에코 효과 성공!');
    
    res.status(200).json({ 
      audioContent: audioBase64,
      contentType: 'audio/mpeg',
      source: 'google-cloud-tts',
      voice: voiceName,
      language: detectedLanguage
    });

  } catch (error) {
    console.error('🔥 Google Cloud TTS (Vaya) 오류:', error.message);
    
    // Google TTS 실패 시 브라우저 TTS fallback
    return res.status(500).json({ 
      error: 'Google Cloud TTS failed', 
      fallback: true,
      details: error.message 
    });
  }
} 