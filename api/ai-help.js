// /api/ai-help.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 2: Bantuan AI
const systemPrompt = `
Anda adalah asisten brainstorming yang cerdas.
Pengguna akan memberikan 'Nama Produk'.
Tugas Anda adalah membuat draf hipotesis untuk 4 bidang lainnya.
Anda HARUS merespons HANYA dengan JSON yang valid.
Format JSON harus:
{
  "jenisProduk": "Hipotesis jenis produk (misal: Skincare, Minuman, Jasa)",
  "lokasiPenjualan": "Hipotesis lokasi penjualan (misal: E-commerce, Toko Offline)",
  "deskripsiProduk": "Hipotesis deskripsi 1-2 kalimat (fitur utama)",
  "targetKonsumen": "Hipotesis target konsumen (misal: Remaja, Pekerja kantoran)"
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

  const { userQuery } = req.body;
  if (!userQuery) {
    return res.status(400).json({ message: 'userQuery tidak ada di body.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
    });

    const generationConfig = {
      temperature: 0.8,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userQuery }] }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error('Error memanggil Gemini API:', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};