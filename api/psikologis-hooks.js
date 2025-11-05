// /api/psikologis-hooks.js
// Ini juga digunakan oleh App 2 untuk "Ringkasan Eksekutif"
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 4: Hooks Iklan
const systemPrompt = `
Anda adalah seorang copywriter ahli.
Pengguna akan memberikan laporan analisis psikologis (atau teks analisis lainnya).
Jika teks meminta "Ringkasan Eksekutif", berikan 1 paragraf ringkasan.
Jika teks TIDAK meminta ringkasan, tugas Anda adalah membuat 5 "Hook Iklan" yang tajam berdasarkan wawasan dari laporan tersebut.
Format sebagai Markdown (HANYA hasilnya, tanpa pengantar):
### 5 Hook Iklan Baru
- **Hook 1 (Angle: [Sebutkan Angle Psikologis])**: "Teks hook di sini..."
- **Hook 2 (Angle: [Sebutkan Angle Psikologis])**: "Teks hook di sini..."
- **Hook 3 (Angle: [Sebutkan Angle Psikologis])**: "Teks hook di sini..."
- **Hook 4 (Angle: [Sebutkan Angle Psikologis])**: "Teks hook di sini..."
- **Hook 5 (Angle: [Sebutkan Angle Psikologis])**: "Teks hook di sini..."
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
  }
  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
  }

  const { prompt } = req.body; // Front-end mengirim 'prompt'
  if (!prompt) {
    return res.status(400).json({ message: 'prompt tidak ada di body.' });
  }

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
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.candidates[0].content.parts[0].text;
    res.status(200).send(responseText); // Kirim sebagai teks biasa (Markdown)
  } catch (error) {
    console.error('Error memanggil Gemini API (Hooks/Summary):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};