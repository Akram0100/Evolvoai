import { GoogleGenerativeAI } from "@google/generative-ai";

// API keys with fallback support (up to 3 keys)
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
].filter(Boolean) as string[];

if (API_KEYS.length === 0) {
  throw new Error("No GEMINI_API_KEY configured in environment variables");
}

// Create clients for each API key
const clients = API_KEYS.map(key => new GoogleGenerativeAI(key));

export const categories = [
  "biznes",
  "texnologiya",
  "marketing",
  "AI",
  "dasturlash",
  "startaplar",
  "dizayn",
  "sotsiomedia",
  "e-commerce",
  "avtomatlashtirish",
  "chatbotlar",
  "SEO",
];

export interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

const prompt = (category: string) => `Sen O'zbekistonning yetakchi ${category} bo'yicha professional jurnalist va tahlilchisan.
O'zbek auditoriyasi uchun yuqori sifatli, chuqur tahliliy va jurnalistik uslubda maqola yoz.

🎯 MAVZU: ${category} sohasida hozirgi kundagi eng dolzarb, muhokama qilinayotgan mavzuni tanla.

📰 JURNALISTIK FORMAT (Albatta quyidagi strukturaga rioya qil):

1. SARLAVHA (60-80 belgi):
   - Jurnalistik sarlavha: "Kim nima qildi" yoki "Nima sodir bo'ldi" formatida
   - Misollar: "O'zbekiston IT sektori 2024-yilda rekord o'sish ko'rsatdi", "Yangi AI startaplar to'lqini: O'zbeklik dasturchilar jahon bozoriga chiqmoqda"

2. LID/KIRISH QISMI (2-3 gap):
   - Kim? Nima? Qachon? Qayerda? Nega? - 5W formatida
   - Eng muhim faktni birinchi gapda ayt
   - Misollar: "O'zbekiston Axborot texnologiyalari vazirligi ma'lumotlariga ko'ra, ..."

3. ASOSIY MATN STRUKTURASI:
   
   ## Voqea tafsilotlari
   - Aniq faktlar va raqamlar bilan (masalan: "35% o'sish", "1.2 million foydalanuvchi")
   - Ekspert fikrlari va iqtiboslar (masalan: *"Bu bizning strategik yo'nalishimiz" - deb ta'kidladi mutaxassis*)
   
   ## Tahlil va kontekst
   - Nima uchun bu muhim?
   - Qanday oqibatlarga olib keladi?
   - Oldingi holatlar bilan taqqoslash
   
   ## Asosiy xulosalar (bullet points)
   - Asosiy xulosalarni aniq punktlarda yoz:
     • Birinchi xulosa
     • Ikkinchi xulosa  
     • Uchinchi xulosa
   
   ## Kelajak istiqbollari
   - Mutaxassislar prognozi
   - Kutilayotgan o'zgarishlar
   - Tavsiyalar

4. XULOSA (1-2 paragraf):
   - Maqolaning asosiy xulosasi
   - O'quvchiga qo'shimcha harakatga undov (CTA)

📝 YOZISH QOIDALARI:
- Har bir da'vo faktlar bilan asoslansin
- Raqamlar va statistika ishlatilsin
- Ekspert fikrlari qo'shilsin (mutaxassis ismlari)
- Bullet pointlar va ro'yxatlar ishlatilsin
- Paragraflar qisqa bo'lsin (3-4 gap)
- Professional jurnalistik uslubda yoz
- Markdown formatlash: **qalin matn**, *kursiv*, ## sarlavhalar, - ro'yxatlar ishlat
- Minimum 1000-1500 so'z

❌ QILMA:
- Oddiy qo'llanma yoki "qanday qilish kerak" formatida yozma
- Umumiy va sayoz mazmun yozma
- Faktlarsiz da'volar qilma

Javobni quyidagi JSON formatda qaytaring:
{
  "title": "Jurnalistik sarlavha",
  "excerpt": "Maqolaning 1-2 gaplik qisqacha mazmuni (lid formati)",
  "content": "To'liq markdown formatdagi professional maqola",
  "seoTitle": "SEO uchun sarlavha (60 belgi)",
  "seoDescription": "SEO uchun tavsif (150-160 belgi)",
  "keywords": ["kalit1", "kalit2", "kalit3", "kalit4", "kalit5"]
}`;

// Generate content with a specific client and model
async function generateWithClient(
  client: GoogleGenerativeAI, 
  category: string,
  keyIndex: number,
  modelName: string = "gemini-2.5-flash"
): Promise<GeneratedContent> {
  const model = client.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  
  console.log(`[Gemini] Using API key ${keyIndex + 1}/${clients.length} with model ${modelName}`);
  
  const result = await model.generateContent(prompt(category));
  const response = await result.response;
  const text = response.text();

  try {
    // If the model respects responseMimeType, it should be valid JSON.
    // We still do a basic cleanup just in case it wraps in markdown
    const cleanedText = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsedContent: GeneratedContent = JSON.parse(cleanedText);

    // Validate required fields
    if (!parsedContent.title || !parsedContent.content) {
      throw new Error("Generated content is missing required fields");
    }

    return parsedContent;
  } catch (parseError) {
    console.error(`[Gemini] JSON Parse Error for ${modelName}:`, parseError);
    console.error(`[Gemini] Raw text was:`, text.substring(0, 200) + "...");
    throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}

export async function generateBlogPost(category: string): Promise<GeneratedContent> {
  let lastError: Error | null = null;
  
  // Prioritize working models. Removed 1.5/1.0 pro models that returned 404.
  const models = [
    "gemini-2.5-flash",       // Confirmed working (but sometimes bad JSON)
    "gemini-2.0-flash-exp",   // Has quota usually, but good fallback
    "gemini-2.0-flash",       // Has quota usually
  ];

  // Try each combination of Model + API Key
  for (const modelName of models) {
    for (let i = 0; i < clients.length; i++) {
      try {
        return await generateWithClient(clients[i], category, i, modelName);
      } catch (error: any) {
        lastError = error;
        
        const errorMessage = error?.message || "Unknown error";
        console.warn(`[Gemini] Failed with Key ${i + 1} & Model ${modelName}: ${errorMessage.substring(0, 100)}...`);
        
        // Continue to next key/model
        continue;
      }
    }
  }

  // All combinations failed
  console.error(`[Gemini] All keys and models failed. Last error:`, lastError);
  throw lastError || new Error("All API keys and models exhausted");
}

export async function generateMultiplePosts(
  categories: string[],
  maxConcurrent: number = 3
): Promise<Array<{ category: string; content: GeneratedContent | null; error?: string }>> {
  const results: Array<{ category: string; content: GeneratedContent | null; error?: string }> = [];

  // Process in batches to avoid rate limiting
  for (let i = 0; i < categories.length; i += maxConcurrent) {
    const batch = categories.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (category) => {
      try {
        const content = await generateBlogPost(category);
        return { category, content };
      } catch (error) {
        return {
          category,
          content: null,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Wait a bit between batches to avoid rate limiting
    if (i + maxConcurrent < categories.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}
