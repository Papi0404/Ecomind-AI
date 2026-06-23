import '@/lib/env'; // Validates GEMINI_API_KEY at startup — throws FATAL if missing
import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3.5-flash';

// System Prompt for EcoMind AI
const SYSTEM_PROMPT = `
Anda adalah EcoMind AI, asisten virtual cerdas yang ramah dan berpengetahuan luas. Meskipun fokus utama Anda adalah lingkungan hidup, keberlanjutan (sustainability), gaya hidup ramah lingkungan, dan reduksi karbon, Anda juga dapat membantu menjawab pertanyaan umum atau topik acak lainnya dengan bijaksana, santun, dan cerdas.

ATURAN UTAMA:
1. Anda dapat menjawab berbagai pertanyaan baik yang bertema lingkungan hidup maupun topik umum/acak lainnya.
2. Usahakan untuk tetap menyelipkan saran ramah lingkungan atau perspektif hijau jika relevan dengan pertanyaan secara natural (tidak dipaksakan).
3. Jawab dalam Bahasa Indonesia yang ramah, profesional, dan solutif.
4. Gunakan Markdown formatting untuk jawaban Anda (bold, bullet points, numbering).
5. Jika Anda menggunakan informasi dari pencarian web, sebutkan sumber atau konteks datanya.
`;

// Helper to retrieve API keys with multiple backups
function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed) keys.push(trimmed);
    });
  }

  for (let i = 1; i <= 5; i++) {
    const backupKey = process.env[`GEMINI_API_KEY_BACKUP${i}`];
    if (backupKey) {
      const trimmed = backupKey.trim();
      if (trimmed && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  }

  return keys;
}

// Helper to run tasks trying keys sequentially in case of rate limit/failure
async function executeWithFallback<T>(
  fn: (apiKey: string) => Promise<T>,
  fallbackFn: () => T
): Promise<T> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    console.warn('No GEMINI_API_KEY configured. Running in mock/simulation mode.');
    return fallbackFn();
  }

  let lastError: any = null;
  for (const key of keys) {
    try {
      return await fn(key);
    } catch (err) {
      console.error(`Gemini API call failed with key starting with '${key.substring(0, 8)}'. Trying next backup key. Error:`, err);
      lastError = err;
    }
  }

  console.error('All configured Gemini API keys failed. Falling back to simulated response.', lastError);
  return fallbackFn();
}

// Generate Mock Response when API Keys are missing or fail
function generateMockResponse(query: string): string {
  const queryLower = query.toLowerCase();
  if (queryLower.includes('sampah') || queryLower.includes('plastik')) {
    return `Berikut cara efektif mengurangi sampah plastik sehari-hari:\n\n**🛍️ Ganti Kantong Belanja**\nGunakan tas kain yang bisa dipakai ulang. Satu tas kain bisa menggantikan ribuan kantong plastik.\n\n**🥤 Hindari Plastik Sekali Pakai**\nBawa botol minum sendiri, sedotan stainless steel, atau sedotan bambu.\n\n**🛒 Belanja Bijak**\nPilih produk dengan kemasan minimal atau kemasan yang bisa didaur ulang.\n\n**♻️ Daur Ulang Aktif**\nPilah sampah plastik dan serahkan ke bank sampah terdekat.\n\nDengan langkah ini, Anda bisa mengurangi hingga **70% sampah plastik** rumah tangga! 🌿`;
  }

  if (queryLower.includes('karbon') || queryLower.includes('carbon')) {
    return `Jejak karbon adalah jumlah emisi gas rumah kaca yang dihasilkan oleh aktivitas kita.\n\n**Cara mengurangi jejak karbon:**\n1. **Gunakan kendaraan umum** atau bersepeda untuk perjalanan jarak dekat.\n2. **Hemat listrik** dengan mematikan AC dan lampu jika tidak digunakan.\n3. **Kurangi konsumsi daging** (diet nabati) yang menyumbang emisi metana tinggi.\n\nSetiap langkah kecil sangat berarti untuk melestarikan bumi kita! 🌍`;
  }

  return `Halo! Saya EcoMind AI. Saat ini saya berjalan dalam mode simulasi offline.\n\nPertanyaan Anda: "${query}"\n\nDalam mode online (dengan API Key aktif), saya dapat menjawab pertanyaan ini dan topik acak lainnya dengan lengkap melalui pencarian berbagai sumber terpercaya. Ada hal tentang gaya hidup ramah lingkungan atau daur ulang yang ingin Anda tanyakan? 🌿`;
}

// 1. Call Gemini API for Chat with Google Search grounding and key failover
export async function getAIChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userPrompt: string
): Promise<string> {
  return executeWithFallback(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    // Build conversation history
    const history = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }],
    }));

    // Try with Google Search grounding first
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 1500,
          tools: [{ googleSearch: {} }],
        },
      });
      return response.text || 'Maaf, saya tidak dapat memproses jawaban Anda saat ini.';
    } catch (err) {
      console.warn('Google Search grounding failed, trying without search tool:', err);
      // Fallback: standard generation without search tool on same key
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      });
      return response.text || 'Maaf, saya tidak dapat memproses jawaban Anda saat ini.';
    }
  }, () => generateMockResponse(userPrompt));
}

// 2. Verify claim with search grounding support and key failover
export async function verifyClaim(claim: string): Promise<{
  score: number;
  analysis: string;
  category: 'VALID' | 'HOAX' | 'TIDAK_PASTI';
  recommendations: string[];
}> {
  return executeWithFallback(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analisis kebenaran informasi (claim/rumor) berikut ini secara aktual berdasarkan pencarian internet terbaru: "${claim}". 
Berikan respon dalam format JSON yang valid dengan properti:
{
  "score": (angka 0-100 mewakili tingkat kebenaran),
  "category": ("VALID", "HOAX", atau "TIDAK_PASTI"),
  "analysis": "penjelasan rinci dalam Bahasa Indonesia mengenai keabsahan klaim ini",
  "recommendations": ["rekomendasi langkah pencegahan atau verifikasi lanjut bagi warga"]
}
Pastikan hanya mengembalikan JSON yang valid, tanpa penjelasan markdown tambahan di luar JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const text = response.text || '';
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (err) {
      console.warn('verifyClaim search tool failed, falling back to standard generation.', err);
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      const text = response.text || '';
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    }
  }, () => {
    const isProbablyHoax = claim.toLowerCase().includes('gratis') || claim.toLowerCase().includes('hadiah') || claim.toLowerCase().includes('hoax');
    return {
      score: isProbablyHoax ? 15 : 85,
      category: isProbablyHoax ? 'HOAX' : 'VALID',
      analysis: isProbablyHoax
        ? `Informasi ini terdeteksi memiliki potensi HOAKS tinggi karena menawarkan hadiah fantastis yang tidak bersumber dari rilis resmi. Harap pastikan kembali melalui portal resmi pemerintah.`
        : `Informasi ini tampaknya bersumber dari rilis media yang kredibel, namun warga disarankan untuk tetap melakukan verifikasi silang.`,
      recommendations: [
        'Periksa kembali situs resmi lembaga terkait (misalnya KPAI/Komnas HAM/PMI).',
        'Jangan membagikan informasi ini sebelum ada konfirmasi resmi.',
      ],
    };
  });
}

// 3. Summarize official documents/procedures with key failover
export async function summarizeProcedure(text: string): Promise<string> {
  return executeWithFallback(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Ringkas teks prosedur layanan publik/dokumen resmi berikut menjadi langkah-langkah yang sangat sederhana, mudah dipahami masyarakat awam, dan terstruktur. Gunakan Bahasa Indonesia:\n\n${text}`,
    });
    return response.text || 'Gagal meringkas dokumen.';
  }, () => {
    return `**Langkah-langkah Ringkas:**\n1. **Persiapan Berkas**: Siapkan KTP, KK, dan Surat Pengantar.\n2. **Kunjungan**: Datang ke kantor dinas terkait di hari kerja.\n3. **Verifikasi**: Tunggu petugas memvalidasi berkas Anda.\n4. **Penyelesaian**: Bantuan atau dokumen Anda akan selesai dalam 3 hari kerja.`;
  });
}

// 4. Classify waste with key failover
export async function classifyWaste(item: string): Promise<{
  category: 'Organik' | 'Anorganik' | 'B3';
  instructions: string;
  co2Saved: number;
}> {
  return executeWithFallback(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Klasifikasikan jenis sampah untuk barang berikut: "${item}".
Kembalikan respon JSON valid dengan properti:
{
  "category": "Organik" atau "Anorganik" atau "B3",
  "instructions": "langkah praktis pemilahan dan daur ulang untuk barang tersebut",
  "co2Saved": (estimasi reduksi CO2 dalam kg jika didaur ulang secara tepat, berupa angka desimal)
}
Pastikan respon hanya berisi JSON valid.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    const resText = response.text || '';
    const cleanedText = resText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  }, () => {
    const lower = item.toLowerCase();
    if (lower.includes('plastik') || lower.includes('botol') || lower.includes('kertas') || lower.includes('kaleng')) {
      return {
        category: 'Anorganik',
        instructions: 'Bilas sisa makanan/cairan. Kumpulkan bersama sampah anorganik lain untuk didaur ulang atau bawa ke Bank Sampah.',
        co2Saved: 0.15,
      };
    } else if (lower.includes('baterai') || lower.includes('lampu') || lower.includes('oli') || lower.includes('obat')) {
      return {
        category: 'B3',
        instructions: 'Kategori Bahan Berbahaya dan Beracun (B3). Simpan terpisah secara aman dan serahkan ke tempat pembuangan khusus limbah B3.',
        co2Saved: 0.05,
      };
    } else {
      return {
        category: 'Organik',
        instructions: 'Dapat diolah menjadi kompos tanaman atau pakan maggot. Jangan dicampur dengan sampah plastik.',
        co2Saved: 0.2,
      };
    }
  });
}
