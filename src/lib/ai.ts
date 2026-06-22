import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System Prompt for EcoMind AI
const SYSTEM_PROMPT = `
Anda adalah EcoMind AI, asisten virtual dan pakar kecerdasan buatan khusus di bidang lingkungan hidup, keberlanjutan (sustainability), daur ulang, jejak karbon (carbon footprint), gaya hidup ramah lingkungan (eco lifestyle), pengurangan sampah, energi hijau/terbarukan, dan edukasi lingkungan.

ATURAN UTAMA:
1. Anda HANYA boleh menjawab pertanyaan atau membahas topik yang berhubungan dengan lingkungan hidup, sustainability, daur ulang, karbon, energi hijau, gaya hidup ramah lingkungan, sampah, hewan/tumbuhan dalam konteks ekosistem, serta perubahan iklim.
2. Jika pengguna menanyakan topik di luar hal di atas (seperti pemrograman umum, matematika murni, sejarah non-lingkungan, resep makanan non-sustainability, gosip artis, politik umum, olahraga umum, dll.), Anda harus menolaknya secara sopan menggunakan kalimat persis atau variasi dari:
   "Maaf, EcoMind AI difokuskan untuk edukasi dan solusi lingkungan hidup."
3. Jawab dalam Bahasa Indonesia yang ramah, profesional, dan memberikan aksi nyata yang solutif.
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
  if (!isEnvironmentRelated(query)) {
    return 'Maaf, EcoMind AI difokuskan untuk edukasi dan solusi lingkungan hidup.';
  }

  const queryLower = query.toLowerCase();
  if (queryLower.includes('sampah') || queryLower.includes('plastik')) {
    return `Berikut cara efektif mengurangi sampah plastik sehari-hari:\n\n**🛍️ Ganti Kantong Belanja**\nGunakan tas kain yang bisa dipakai ulang. Satu tas kain bisa menggantikan ribuan kantong plastik.\n\n**🥤 Hindari Plastik Sekali Pakai**\nBawa botol minum sendiri, sedotan stainless steel, atau sedotan bambu.\n\n**🛒 Belanja Bijak**\nPilih produk dengan kemasan minimal atau kemasan yang bisa didaur ulang.\n\n**♻️ Daur Ulang Aktif**\nPilah sampah plastik dan serahkan ke bank sampah terdekat.\n\nDengan langkah ini, Anda bisa mengurangi hingga **70% sampah plastik** rumah tangga! 🌿`;
  }
  
  if (queryLower.includes('karbon') || queryLower.includes('carbon')) {
    return `Jejak karbon adalah jumlah emisi gas rumah kaca yang dihasilkan oleh aktivitas kita.\n\n**Cara mengurangi jejak karbon:**\n1. **Gunakan kendaraan umum** atau bersepeda untuk perjalanan jarak dekat.\n2. **Hemat listrik** dengan mematikan AC dan lampu jika tidak digunakan.\n3. **Kurangi konsumsi daging** (diet nabati) yang menyumbang emisi metana tinggi.\n\nSetiap langkah kecil sangat berarti untuk melestarikan bumi kita! 🌍`;
  }

  return `Terima kasih atas pertanyaan Anda tentang lingkungan hidup!\n\nAsisten EcoMind AI sangat menyarankan Anda melakukan aksi nyata berikut:\n* Kurangi penggunaan energi fosil\n* Pilah sampah dari rumah\n* Tanam pohon di pekarangan\n* Gunakan air secara bijak\n\nAda hal spesifik lain tentang keberlanjutan yang ingin Anda ketahui? 🌿`;
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

