import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Validate API Key 2
const apiKey = process.env.GEMINI_API_KEY2;
if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY2 is not defined! Falling back to primary key or failing.");
}

const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || "");

// Use Gemini 2.0 Flash for speed and search capabilities
// Trying to use specific model that supports Search Grounding
const MODEL_NAME = "gemini-2.0-flash"; 

export interface TrendingPostContent {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

/**
 * Perform a Google Search grounded generation
 */
export async function generateTrendingPost(category: string): Promise<TrendingPostContent> {
  // 1. Initialize Model with Search Tool
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: [{ googleSearch: {} }] as any, // Enable Google Search Grounding
  });

  const prompt = `Google Search orqali "${category}" mavzusidagi so'nggi 24 soatdagi eng muhim yangiliklar va trendlarni top.

Topilgan eng dolzarb yangilik asosida O'zbek tilida PROFESSIONAL jurnalistik maqola yoz.

📰 MAQOLA FORMATI:

1. SARLAVHA: 
   - Jurnalistik uslubda (masalan: "Google yangi AI modelini taqdim etdi: Gemini 2.0 Flash imkoniyatlari")
   - 🔥 emoji bilan boshlash mumkin

2. LID (Kirish - 2-3 gap):
   - 5W formati: Kim? Nima? Qachon? Qayerda? Nega?
   - Eng muhim fakt birinchi gapda

3. ASOSIY MATN:
   
   ## Voqea tafsilotlari
   - Aniq faktlar, raqamlar, sanalar
   - Kompaniya/tashkilot nomlari
   
   ## Nima uchun muhim?
   - Tahlil va kontekst
   - Foydalanuvchilarga ta'siri
   
   ## Asosiy xulosalar
   • Birinchi xulosa
   • Ikkinchi xulosa
   • Uchinchi xulosa

4. XULOSA (1 paragraf):
   - Qisqacha yakuniy fikr
   - Kelajak istiqbollari

📝 QOIDALAR:
- O'zbek tili (lotin yozuvi)
- Professional jurnalistik uslub
- Minimum 600-800 so'z
- Markdown formatlash: **qalin**, *kursiv*, ## sarlavhalar, - ro'yxatlar
- Raqamlar va statistika ishlatish

JSON formatda qaytaring:
{
  "title": "🔥 Jurnalistik sarlavha",
  "excerpt": "Yangilik mazmunini 1-2 gapda ifodalovchi lid",
  "content": "To'liq markdown formatdagi professional maqola",
  "seoTitle": "SEO sarlavha",
  "seoDescription": "SEO tavsif (150-160 belgi)",
  "keywords": ["kalit1", "kalit2", "kalit3", "kalit4"]
}`;

  try {
    console.log(`🔍 Searching and generating trending post for: ${category}...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Gemini response");
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    return data; // No TTS anymore

  } catch (error) {
    console.error("❌ Error in generateTrendingPost:", error);
    throw error;
  }
}

// Removed google-tts-api import
// import { getAudioUrl } from "google-tts-api";
// import https from "https";

/**
 * Generate TTS (Audio) Summary using Gemini 2.5 Pro Preview TTS
 */
export async function generateAudioSummary(text: string): Promise<string | null> {
  try {
    console.log("   🎤 Generating audio with Gemini 2.5 Pro TTS...");
    
    // Initialize the specific TTS model requested by user
    const ttsModel = genAI.getGenerativeModel({ 
      model: "models/gemini-2.5-pro-preview-tts" 
    });

    // Request audio generation
    // We expect the model to return audio data.
    const result = await ttsModel.generateContent({
      contents: [{ role: "user", parts: [{ text: text }] }],
      // Explicitly request AUDIO response
      generationConfig: {
        responseMimeType: "audio/mp3",
        // @ts-ignore
        responseModalities: ["AUDIO"],
      } as any, 
    });

    const response = await result.response;
    
    // ... [Gemini TTS logic] ...
    
    // Check for "inlineData" or audio part in the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No candidates returned from TTS model");

    const parts = candidates[0].content.parts;
    const audioPart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith("audio/"));

    if (!audioPart || !audioPart.inlineData) {
       console.warn("   ⚠️ Gemini TTS returned no audio. Falling back...");
       throw new Error("No audio content in response");
    }

    // Decode Base64 audio
    const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");
    const audioDir = path.join(process.cwd(), "public", "uploads", "audio");
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

    const fileName = `gemini-tts-${uuidv4()}.mp3`; 
    const filePath = path.join(audioDir, fileName);
    fs.writeFileSync(filePath, audioBuffer);
    
    console.log("   ✅ Gemini TTS saved:", fileName);
    return filePath;

  } catch (error: any) {
    console.error("   ⚠️ Gemini TTS Failed:", error.message);
    console.log("   🔄 Falling back to Google Translate TTS...");
    
    // Fallback: Python gTTS (Reliable)
    try {
      console.log("   🔄 Using Python gTTS...");
      const { exec } = require("child_process");
      const util = require("util");
      const execPromise = util.promisify(exec);
      
      const audioDir = path.join(process.cwd(), "public", "uploads", "audio");
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

      const fileName = `tts-py-${uuidv4()}.mp3`;
      const filePath = path.join(audioDir, fileName);
      
      const scriptPath = path.join(process.cwd(), "scripts", "tts.py");
      
      // Escape text for command line (basic)
      const safeText = text.replace(/"/g, '\\"').slice(0, 500); // Allow longer text with gTTS
      
      // Execute python script
      await execPromise(`python "${scriptPath}" "${safeText}" "${filePath}"`);
      
      // Check file
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
          console.log(`   ✅ Python TTS saved:`, fileName);
          return filePath;
      } else {
          throw new Error("Python script did not generate valid file");
      }

    } catch (pyError: any) {
       console.error("   ❌ Python TTS failed:", pyError.message);
       return null;
    }
  }
}
