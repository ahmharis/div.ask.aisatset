// /api/psikologis-market.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 4: Psikologis Market
const systemPrompt = `
Anda adalah "AI Audience Profiler", seorang detektif psikologis market yang ahli.
Tugas Anda adalah menerima berbagai data mentah (mapping market, review, obrolan sosial) dan mensintesisnya menjadi satu laporan psikologis yang mendalam.
Anda HARUS memformat respons Anda dalam format Markdown yang kaya (HTML akan dihasilkan di front-end).
Gunakan # untuk H1, ## untuk H2, ### untuk H3, dan - untuk poin-poin.

Struktur Laporan WAJIB:
# Laporan Psikologis Audiens
## 1. Wawasan Kunci (Key Insights)
- Poin utama 1
- Poin utama 2
- Poin utama 3

## 2. Analisis Psikografis Mendalam
### Motivasi Utama (Core Motivations)
- **Motivasi 1 (cth: Status, Keamanan, Pertumbuhan)**: Penjelasan...
- **Motivasi 2**: Penjelasan...

### Titik Masalah (Pain Points)
- **Masalah Teridentifikasi 1**: Penjelasan...
- **Masalah Tersembunyi (Yang tidak mereka katakan)**: Penjelasan...

### Keinginan & Aspirasi (Gains & Aspirations)
- **Keinginan Eksplisit**: Penjelasan...
- **Aspirasi Terdalam**: Penjelasan...

## 3. Analisis Bahasa & Sentimen
### Bahasa yang Mereka Gunakan
- "Kutipan atau frasa umum 1"
- "Kutipan atau frasa umum 2"
### Sentimen Umum
- Penjelasan sentimen (cth: Frustrasi, Harapan, Skeptis)

## 4. Rekomendasi Strategis
### Angle Komunikasi yang Direkomendasikan
- **Angle 1**: Penjelasan...
- **Angle 2**: Penjelasan...
### Nada Suara (Tone of Voice) yang Tepat
- [Deskripsi nada suara, cth: Empati, Otoritatif, Humoris]

Pastikan analisisnya tajam, psikologis, dan actionable. HANYA berikan respons dalam format Markdown seperti di atas.
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
  }
  if (!API_KEY) {
    return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
  }

  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ message: 'userInput tidak ada di body.' });
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
      contents: [{ role: 'user', parts: [{ text: userInput }] }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.candidates[0].content.parts[0].text;
    res.status(200).send(responseText); // Kirim sebagai teks biasa (Markdown)
  } catch (error) {
    console.error('Error memanggil Gemini API (Psikologis Market):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};