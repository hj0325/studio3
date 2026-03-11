import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API key is not configured',
      hint: 'Set GOOGLE_API_KEY (recommended) or GEMINI_API_KEY in environment variables.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    const message = error?.message || 'Unknown error';
    return res.status(500).json({ error: 'Gemini request failed', details: message });
  }
}

