const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.openai_api_key;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenAI API key is not configured',
      hint: 'Set OPENAI_API_KEY or openai_api_key in environment variables.',
    });
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Never echo secrets; keep message generic.
      const status = response.status;
      const detail = data?.error?.message || 'Request failed';
      return res.status(500).json({ error: 'LLM request failed', status, details: detail });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (error) {
    const message = error?.message || 'Unknown error';
    return res.status(500).json({ error: 'LLM request failed', details: message });
  }
}

