// /api/map-market.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = process.env.GEMINI_API_KEY;

// Prompt Sistem untuk App 3: Mapping Market
const systemPrompt = `
Anda adalah "AI Market Mapper" yang terhubung dengan Google Search.
Tugas Anda adalah menerima data produk (dalam format YAML) dan melakukan analisis pasar MENDALAM.
Anda HARUS menggunakan Google Search untuk menemukan tren, statistik, dan wawasan kompetitor terbaru.

Format output Anda harus HTML yang kaya.
Struktur yang disarankan:
<h2>Analisis Tren Pasar & Peluang</h2>
<p>...</p>
<h3>1. Tren Pasar Utama (Data dari Google Search)</h3>
<ul>
  <li><strong>Tren 1</strong>: Penjelasan...</li>
  <li><strong>Tren 2</strong>: Penjelasan...</li>
</ul>
<h3>2. Analisis Kompetitor (Jika ada)</h3>
<p>...</p>
<h3>3. Peluang (Opportunity) yang Teridentifikasi</h3>
<ul>
  <li>Peluang 1...</li>
  <li>Peluang 2...</li>
</ul>
<h3>4. Rekomendasi Sudut Pandang (Angle) Konten</h3>
<p>Berdasarkan data, berikut adalah angle yang direkomendasikan:</p>
<ul>
  <li><strong>Angle untuk Audiens Primer</strong>: ...</li>
  <li><strong>Angle untuk Audiens Sekunder</strong>: ...</li>
</ul>

PENTING: Gunakan Google Search secara ekstensif. Berikan jawaban yang mendalam, berwawasan, dan berbasis data.
Format output HANYA HTML. Jangan tambahkan \`\`\`html.
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
      tools: [{ "google_search": {} }],
    });

    const generationConfig = {
      temperature: 0.5,
      maxOutputTokens: 8192,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      // ... (safety settings lainnya)
    ];

    const chat = model.startChat();
    const result = await chat.sendMessage(userInput);
    const response = result.response;
    const candidate = response.candidates[0];

    const analysisText = candidate.content.parts[0].text;
    
    // Ekstrak sitasi (sumber) dari Google Search
    let citations = [];
    if (candidate.groundingMetadata && candidate.groundingMetadata.groundingAttributions) {
      citations = candidate.groundingMetadata.groundingAttributions
        .map(attribution => ({
          uri: attribution.web?.uri,
          title: attribution.web?.title,
        }))
        .filter(source => source.uri && source.title);
    }
    
    // Kirim kembali sebagai JSON seperti yang diharapkan front-end
    res.status(200).json({ analysisText, citations });

  } catch (error) {
    console.error('Error memanggil Gemini API (Map Market):', error);
    res.status(500).json({ message: `Error internal server: ${error.message}` });
  }
};