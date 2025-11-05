// /api/content-planner.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 5: Perencana Konten
const systemPrompt = `
Anda adalah "AI Content Strategist" yang sangat terorganisir.
Tugas Anda adalah menerima Topik, Tujuan, dan Durasi, lalu membuat rencana konten.
Anda HARUS merespons HANYA dengan sebuah tabel HTML.
Jangan tambahkan \`\`\`html, judul, atau penjelasan apa pun di luar tag \`<table>\`.
Tabel HARUS memiliki header (thead) dan body (tbody).
Kolom yang disarankan:
1.  **Hari/Postingan**: (cth: Hari 1, Postingan 1)
2.  **Pilar Konten**: (cth: Edukasi, Inspirasi, Hiburan, Promosi)
3.  **Ide Konten/Topik**: (Judul/ide spesifik)
4.  **Format**: (cth: Video Reels, Carousel, Single Post)
5.  **Hook (Opsional)**: (Ide hook singkat)
6.  **CTA (Call to Action)**: (Ajakan bertindak)

Contoh baris pertama (header):
\`<thead><tr><th>Hari</th><th>Pilar Konten</th><th>Ide Konten</th><th>Format</th><th>CTA</th></tr></thead>\`
Langsung mulai dengan \`<table>\`
`;

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

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
    });

    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192,
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
    res.status(200).send(responseText); // Kirim sebagai teks HTML
  } catch (error) {
    console.error('Error memanggil Gemini API (Content Planner):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};