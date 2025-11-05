// /api/tts-generator.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-tts';
const API_KEY = process.env.GEMINI_API_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
  }
  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
  }

  const { promptText, voice } = req.body;
  if (!promptText || !voice) {
    return res.status(400).json({ message: 'promptText dan voice diperlukan.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const payload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }
          }
        }
      },
    };

    const result = await model.generateContent(payload);
    
    const part = result?.response?.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;

    if (audioData && mimeType && mimeType.startsWith("audio/")) {
      // Kirim kembali data base64 dan mimeType
      res.status(200).json({ audioData, mimeType });
    } else {
      throw new Error("Respons API tidak valid atau tidak mengandung data audio.");
    }

  } catch (error) {
    console.error('Error memanggil Gemini TTS API:', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};