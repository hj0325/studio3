export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Google Cloud TTS API 호출
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_CLOUD_TTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'ko-KR',
          name: 'ko-KR-Neural2-A', // 자연스러운 여성 목소리
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.75, // 조금 느리게 (바야 캐릭터에 맞게)
          pitch: -2.0, // 낮고 차분하게
          volumeGainDb: 0.0
        }
      })
    });

    if (!response.ok) {
      console.error('Google TTS API Error:', await response.text());
      // Fallback: 브라우저 TTS 사용하도록 클라이언트에 알림
      return res.status(500).json({ error: 'TTS service unavailable', fallback: true });
    }

    const data = await response.json();
    
    // Base64 오디오 데이터를 클라이언트에 반환
    res.status(200).json({ 
      audioContent: data.audioContent,
      contentType: 'audio/mpeg'
    });

  } catch (error) {
    console.error('TTS Error:', error);
    // Fallback 옵션 제공
    res.status(500).json({ error: 'TTS service error', fallback: true });
  }
} 