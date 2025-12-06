const { PrismaClient } = require("@prisma/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

async function generateWithAI() {
  console.log("🤖 Gemini AI bilan post yaratilmoqda...\n");

  try {
    // Use gemini-2.0-flash as found in available models
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `O'zbek tilida professional blog post yozing. Mavzu: "Biznesni Avtomatlashtirish". 

Quyidagi JSON formatda qaytaring (faqat JSON, boshqa matn yo'q):

{
  "title": "Blog post sarlavhasi",
  "excerpt": "Qisqacha mazmun, 1-2 jumla",
  "seoTitle": "SEO uchun title",
  "seoDescription": "SEO description",
  "keywords": ["kalit", "so'zlar"],
  "content": "To'liq markdown formatda yozilgan maqola. Kamida 500 so'z. ## Sarlavhalar, bullet points va formatlash bilan."
}`;

    console.log("   📡 Gemini API'ga so'rov yuborilmoqda...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("   ✅ AI javob olindi!\n");

    // Clean JSON (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonText);

    // Save to database
    const post = await prisma.blogPost.create({
      data: {
        category: "Biznes",
        title: data.title,
        slug: generateSlug(data.title),
        excerpt: data.excerpt,
        content: data.content,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        keywords: data.keywords,
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop",
        readTime: calculateReadTime(data.content),
        status: "PUBLISHED",
      },
    });

    console.log("✅ AI-generated post saqlandi!\n");
    console.log("   📝 Title:", post.title);
    console.log("   🔗 Slug:", post.slug);
    console.log("   ⏱️  Read Time:", post.readTime, "min");
    console.log("   📊 Category:", post.category);
    console.log("\n🌐 Ko'rish: http://localhost:3003/blog/" + post.slug);
    console.log("\n🎉 Muvaffaqiyat! Haqiqiy AI post yaratildi!");

// Telegram function (copied from lib/telegram.ts to run in standalone script)
    const { Bot } = require("grammy");
    const bot = process.env.TELEGRAM_BOT_TOKEN ? new Bot(process.env.TELEGRAM_BOT_TOKEN) : null;

    if (bot && process.env.TELEGRAM_CHANNEL_ID) {
      console.log("   📨 Telegram kanalga yuborilmoqda...");
      try {
        const message = `🤖 <b>${post.title}</b>\n\n${post.excerpt}\n\n🔗 <a href="http://localhost:3000/blog/${post.slug}">To'liq o'qish</a>\n\n#${post.category} #EvolvoAI`;
        
        await bot.api.sendPhoto(process.env.TELEGRAM_CHANNEL_ID, post.imageUrl, {
          caption: message,
          parse_mode: "HTML"
        });
        console.log("   ✅ Telegramga yuborildi!");
      } catch (err) {
        console.error("   ❌ Telegram xatosi:", err.message);
      }
    }

    return post;
  } catch (error) {
    console.error("\n❌ Xatolik:", error.message);
    
    if (error.message.includes("API key")) {
      console.log("\n⚠️  GEMINI_API_KEY noto'g'ri yoki mavjud emas");
      console.log("   .env faylini tekshiring");
    } else if (error.message.includes("model")) {
      console.log("\n⚠️  Model nomi noto'g'ri");
      console.log("   'gemini-1.5-flash' yoki 'gemini-1.5-pro' ishlatiladi");
    } else if (error.message.includes("JSON")) {
      console.log("\n⚠️  AI javobni parse qilib bo'lmadi");
      console.log("   AI to'g'ri JSON formatda javob bermadi");
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateWithAI();
