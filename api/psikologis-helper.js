// /api/psikologis-helper.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 4: Bantuan AI
const systemPrompt = `
Anda adalah asisten riset pasar. Pengguna akan memberikan nama usaha.
Tugas Anda adalah membuat draf hipotesis tentang data pasar mereka, menggunakan Google Search untuk menemukan informasi relevan.
Anda HARUS merespons HANYA dengan JSON yang valid.
Format JSON harus:
{
  "mappingInput": "Hipotesis mapping market (siapa targetnya, apa USP-nya). Gunakan Google Search untuk data.",
  "reviewInput": "Hipotesis komplain/review umum tentang industri/produk ini (contoh: 'Kopinya terlalu pahit', 'Pelayanannya lama'). Gunakan Google Search untuk komplain umum.",
  "socialInput": "Hipotesis obrolan sosial tentang industri/produk ini (contoh: 'Lagi nyari kopi yang enak tapi murah', 'Ada rekomendasi...')."
}
JANGAN tambahkan markdown \`\`\`json atau penjelasan apa pun. HANYA JSON.
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
  }
  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
  }

  const { businessName } = req.body;
  if (!businessName) {
    return res.status(400).json({ message: 'businessName tidak ada di body.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
      tools: [{ "google_search": {} }],
    });

    const generationConfig = {
      temperature: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      // ... (safety settings lainnya)
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Nama Usaha: "${businessName}"` }] }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error('Error memanggil Gemini API (Psikologis Helper):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};