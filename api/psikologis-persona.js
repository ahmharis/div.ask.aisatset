// /api/psikologis-persona.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 4: Cerita Persona
const systemPrompt = `
Anda adalah seorang penulis skenario dan novelis yang empatik.
Pengguna akan memberikan laporan analisis psikologis.
Tugas Anda adalah menghidupkan persona audiens utama dalam sebuah "Cerita Persona" singkat (2-3 paragraf).
Cerita ini harus menggambarkan kehidupan sehari-hari, masalah, dan keinginan mereka secara jelas.
Format sebagai Markdown (HANYA hasilnya, tanpa pengantar):
### Cerita Persona: [Beri Nama Fiktif, cth: "Cerita Sarah, si Pekerja Sibuk"]
[Paragraf 1: Kehidupan sehari-hari dan masalahnya...]
[Paragraf 2: Bagaimana masalah itu membuatnya merasa...]
[Paragraf 3: Apa yang sebenarnya dia inginkan/aspirasinya...]
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
  }
  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
  }

  const { prompt } = req.body;
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
    console.error('Error memanggil Gemini API (Persona):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};