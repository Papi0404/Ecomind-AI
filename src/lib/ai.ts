import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System Prompt for EcoMind AI
const SYSTEM_PROMPT = `
Anda adalah EcoMind AI, asisten virtual cerdas yang ramah dan berpengetahuan luas. Meskipun fokus utama Anda adalah lingkungan hidup, keberlanjutan (sustainability), gaya hidup ramah lingkungan, dan reduksi karbon, Anda juga dapat membantu menjawab pertanyaan umum atau topik acak lainnya dengan bijaksana, santun, dan cerdas.

ATURAN UTAMA:
1. Anda dapat menjawab berbagai pertanyaan baik yang bertema lingkungan hidup maupun topik umum/acak lainnya.
2. Usahakan untuk tetap menyelipkan saran ramah lingkungan atau perspektif hijau jika relevan dengan pertanyaan secara natural (tidak dipaksakan).
3. Jawab dalam Bahasa Indonesia yang ramah, profesional, dan solutif.
4. Gunakan Markdown formatting untuk jawaban Anda (bold, bullet points, numbering).
`;

// Helper to check if a query is related to environment (heuristic fallback for mock mode)
function isEnvironmentRelated(query: string): boolean {
  const keywords = [
    'lingkungan', 'sampah', 'plastik', 'daur ulang', 'carbon', 'karbon', 'eco', 'pohon', 'hutan',
    'sustainability', 'iklim', 'energi', 'surya', 'air', 'organik', 'kompos', 'emisi', 'hijau',
    'suhu', 'bumi', 'hewan', 'tumbuhan', 'polusi', 'udara', 'kertas', 'botol', 'planet', 'diet'
  ];
  const lower = query.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

// Generate Mock Response when API Key is missing
function generateMockResponse(query: string): string {
  const queryLower = query.toLowerCase();
  if (queryLower.includes('sampah') || queryLower.includes('plastik')) {
    return `Berikut cara efektif mengurangi sampah plastik sehari-hari:\n\n**🛍️ Ganti Kantong Belanja**\nGunakan tas kain yang bisa dipakai ulang. Satu tas kain bisa menggantikan ribuan kantong plastik.\n\n**🥤 Hindari Plastik Sekali Pakai**\nBawa botol minum sendiri, sedotan stainless steel, atau sedotan bambu.\n\n**🛒 Belanja Bijak**\nPilih produk dengan kemasan minimal atau kemasan yang bisa didaur ulang.\n\n**♻️ Daur Ulang Aktif**\nPilah sampah plastik dan serahkan ke bank sampah terdekat.\n\nDengan langkah ini, Anda bisa mengurangi hingga **70% sampah plastik** rumah tangga! 🌿`;
  }
  
  if (queryLower.includes('karbon') || queryLower.includes('carbon')) {
    return `Jejak karbon adalah jumlah emisi gas rumah kaca yang dihasilkan oleh aktivitas kita.\n\n**Cara mengurangi jejak karbon:**\n1. **Gunakan kendaraan umum** atau bersepeda untuk perjalanan jarak dekat.\n2. **Hemat listrik** dengan mematikan AC dan lampu jika tidak digunakan.\n3. **Kurangi konsumsi daging** (diet nabati) yang menyumbang emisi metana tinggi.\n\nSetiap langkah kecil sangat berarti untuk melestarikan bumi kita! 🌍`;
  }

  return `Halo! Saya EcoMind AI. Saat ini saya berjalan dalam mode simulasi offline.\n\nPertanyaan Anda: "${query}"\n\nDalam mode online (dengan API Key aktif), saya dapat menjawab pertanyaan ini dan topik acak lainnya dengan lengkap. Ada hal tentang gaya hidup ramah lingkungan atau daur ulang yang ingin Anda tanyakan? 🌿`;
}

// 5. Call Gemini API
export async function getAIChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userPrompt: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    // API Key is not set, run in Sandbox simulated mode
    console.warn('GEMINI_API_KEY is not configured. Running in mock/simulation mode.');
    // Add artificial delay to simulate real network request
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateMockResponse(userPrompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Instantiate model with system instructions
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Format history for Generative SDK
    const history = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(userPrompt);
    const responseText = result.response.text();

    return responseText || 'Maaf, saya tidak dapat memproses jawaban Anda saat ini.';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    // Graceful fallback to Mock Response if API error occurs
    return generateMockResponse(userPrompt);
  }
}

