const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

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

    // 환경변수에서 서비스 계정 키 가져오기 (Vercel 배포용)
    let client;
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // 환경변수에 JSON 문자열로 저장된 서비스 계정 키 사용
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      client = new TextToSpeechClient({
        credentials,
        projectId: credentials.project_id
      });
      console.log('✅ Google Cloud TTS 클라이언트 초기화 (환경변수 사용)');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // 로컬 개발용 파일 경로
      client = new TextToSpeechClient();
      console.log('✅ Google Cloud TTS 클라이언트 초기화 (파일 경로 사용)');
    } else {
      // 로컬 개발용 기본 설정 (기존 방식)
      const path = require('path');
      const keyFilePath = path.join(process.cwd(), 'pages', 'api', 'vaya-voice-9a75a34cc232.json');
      client = new TextToSpeechClient({
        keyFilename: keyFilePath,
        projectId: 'vaya-voice'
      });
      console.log('✅ Google Cloud TTS 클라이언트 초기화 (기본 파일 경로 사용)');
    }

    // 텍스트 언어 감지 함수
    const detectLanguage = (text) => {
      const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
      return koreanRegex.test(text) ? 'ko-KR' : 'en-US';
    };

    const detectedLanguage = detectLanguage(text.trim());
    console.log('🌍 감지된 언어:', detectedLanguage);

    // Vaya 음성 설정 (원래 설정으로 복원)
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
      <prosody pitch="-2st" rate="0.9">
        ${text.trim()}
      </prosody>
    </speak>`;

    const request = {
      input: { ssml: ssmlText },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        sampleRateHertz: 24000, // 고품질 샘플 레이트
        // 단순화된 설정으로 음질 개선
        speakingRate: 0.9, // 적당한 속도
        pitch: -2.0, // 적당한 낮은 음조
        volumeGainDb: 0.0, // 기본 볼륨
      }
    };

    console.log('🎭 Vaya 음성 요청 (자연스럽게 수정):', {
      voice: request.voice.name,
      language: request.voice.languageCode,
      speakingRate: request.audioConfig.speakingRate,
      ssml: 'prosody rate="slow" pitch="-2st"'
    });

    // Google Cloud TTS API 호출
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    // Base64로 인코딩
    const audioBase64 = response.audioContent.toString('base64');
    
    const voiceName = detectedLanguage === 'ko-KR' ? 
      'Vaya (ko-KR-Neural2-C, 자연스러운 음성)' : 
      'Vaya (en-US-Neural2-A, 자연스러운 음성)';
    
    console.log('✅ Google Cloud TTS (Vaya) 자연스러운 음성 성공!');
    
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