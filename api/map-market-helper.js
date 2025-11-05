// /api/map-market-helper.js
  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

  const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
  const API_KEY = process.env.GEMINI_API_KEY;

  // Prompt Sistem untuk App 3: Bantuan AI
  const systemPrompt = `
  Anda adalah asisten brainstorming produk.
  Pengguna akan memberikan 'Nama Produk'.
  Tugas Anda adalah membuat draf hipotesis untuk value map produk tersebut.
  Anda HARUS merespons HANYA dengan JSON yang valid.
  Format JSON harus:
  {
    "usp": "Hipotesis USP (1 kalimat)",
    "audiencePrimary": "Hipotesis Audiens Primer",
    "audienceSecondary": "Hipotesis Audiens Sekunder",
    "customerJobs": "- Tugas pelanggan 1\n- Tugas pelanggan 2",
    "customerPains": "- Masalah pelanggan 1\n- Masalah pelanggan 2",
    "customerGains": "- Keinginan pelanggan 1\n- Keinginan pelanggan 2"
  }
  (Gunakan \n untuk baris baru di dalam string untuk 'customerJobs', 'customerPains', dan 'customerGains').
  JANGAN tambahkan markdown \`\`\`json atau penjelasan apa pun. HANYA JSON.
  `;

  module.exports = async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Metode tidak diizinkan. Hanya POST.' });
    }
    if (!API_KEY) {
      return res.status(500).json({ message: 'API Key Gemini tidak diatur di server.' });
    }

    const { productName } = req.body;
    if (!productName) {
      return res.status(400).json({ message: 'productName tidak ada di body.' });
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: systemPrompt,
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
        contents: [{ role: 'user', parts: [{ text: `Nama Produk: "${productName}"` }] }],
        generationConfig,
        safetySettings,
      });

      const responseText = result.response.candidates[0].content.parts[0].text;
      res.status(200).json(JSON.parse(responseText));
    } catch (error) {
      console.error('Error memanggil Gemini API (Map Helper):', error);
      res.status(500).json({ message: `Error internal server: ${error.message}` });
    }
  };