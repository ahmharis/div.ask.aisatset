// /api/copywriting.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 6: Copywriting
// (Prompt sistem akan dibuat dinamis di dalam fungsi)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
  }
  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
  }

  const { userPrompt } = req.body;
  if (!userPrompt) {
    return res.status(400).json({ message: 'userPrompt tidak ada di body.' });
  }

  // Ekstrak detail dari userPrompt untuk membuat System Prompt
  // (Front-end sudah memformat userPrompt dengan baik)
  
  const systemPrompt = `
Anda adalah seorang "AI Copywriter" ahli yang menguasai berbagai formula (AIDA, PAS, dll) dan bahasa.
Pengguna akan memberi Anda detail lengkap.
Tugas Anda adalah menulis copywriting yang diminta.
PENTING: Berikan HANYA hasil copywriting yang sudah jadi, siap pakai, dalam bahasa yang diminta.
Jangan tambahkan "Tentu, ini hasilnya:", "Hasil Copywriting:", atau penjelasan apa pun. Langsung tulis copywritingnya.
Jika diminta format video (Reels/Tiktok/Youtube), berikan dalam format skrip (cth: "SCENE 1: ...", "VOICEOVER: ...").
Jika diminta format teks (Status/Caption), berikan sebagai teks biasa dengan emoji yang relevan.
`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
    });

    const generationConfig = {
      temperature: 0.9,
      maxOutputTokens: 4096,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      // ... (safety settings lainnya)
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.candidates[0].content.parts[0].text;
    res.status(200).send(responseText); // Kirim sebagai teks biasa
  } catch (error) {
    console.error('Error memanggil Gemini API (Copywriting):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};