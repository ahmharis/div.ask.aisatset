// /api/analyze.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 2: Analisis Value
const systemPrompt = `
Anda adalah "AI Value Product Analyst" yang ahli.
Tugas Anda adalah menerima data produk mentah dari pengguna dan mengubahnya menjadi analisis nilai produk yang komprehensif.
Anda HARUS memformat respons Anda dalam DUA bagian, dipisahkan oleh '---VISUAL_BREAK---'.

BAGIAN 1 (Visual):
Tulis analisis yang kaya, mudah dibaca manusia, menggunakan markdown (misal: **bold** untuk judul, *italic*, dan poin-poin).
Strukturnya harus:
1.  **Nama Produk**: [Nama]
2.  **Ringkasan USP (Unique Selling Proposition)**: [1 kalimat USP]
3.  **Analisis Nilai Produk (Value Proposition)**:
    * **Fitur Kunci**: [Poin-poin fitur]
    * **Manfaat Fungsional**: [Apa yang dilakukan fitur itu untuk pelanggan?]
    * **Manfaat Emosional**: [Apa yang dirasakan pelanggan?]
4.  **Analisis Target Audiens**:
    * **Audiens Primer**: [Deskripsi]
    * **Audiens Sekunder**: [Deskripsi]
5.  **Analisis Kompetitor (Opsional)**: [Jika disediakan]
6.  **Positioning & Keunggulan**: [Bagaimana produk ini menonjol?]

BAGIAN 2 (YAML):
Setelah '---VISUAL_BREAK---', sediakan versi data YAML yang bersih dan terstruktur dari analisis tersebut. Ini untuk digunakan oleh alat lain.
Strukturnya harus:
\`\`\`yaml
product_name: "Nama Produk"
usp: "Ringkasan USP dalam satu kalimat"
audience:
  primary: "Deskripsi audiens primer"
  secondary: "Deskripsi audiens sekunder"
value_map:
  customer_jobs:
    - "Tugas/kebutuhan pelanggan 1"
    - "Tugas/kebutuhan pelanggan 2"
  customer_pains:
    - "Masalah/rasa sakit pelanggan 1"
    - "Masalah/rasa sakit pelanggan 2"
  customer_gains:
    - "Keinginan/keuntungan pelanggan 1"
    - "Keinginan/keuntungan pelanggan 2"
  pain_relievers:
    - "Bagaimana produk mengatasi rasa sakit 1"
    - "Bagaimana produk mengatasi rasa sakit 2"
  gain_creators:
    - "Bagaimana produk menciptakan keuntungan 1"
    - "Bagaimana produk menciptakan keuntungan 2"
features:
  - "Fitur 1: Manfaat"
  - "Fitur 2: Manfaat"
positioning: "Pernyataan positioning singkat"
\`\`\`
Pastikan untuk memisahkan kedua bagian HANYA dengan '---VISUAL_BREAK---'.
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
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
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
    res.status(200).send(responseText); // Kirim sebagai teks biasa
  } catch (error) {
    console.error('Error memanggil Gemini API:', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};