import { NextRequest, NextResponse } from "next/server";
import { generateBlogPost, categories } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { generateSlug, calculateReadTime } from "@/lib/utils";
import { sendToChannel, notifySubscribers } from "@/lib/telegram";
import { fetchCategoryImage, trackImageDownload } from "@/lib/unsplash";

// Allow up to 120 seconds for this route (for Vercel/Render)
export const maxDuration = 120;

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn("[CRON] CRON_SECRET not set - allowing request");
    return true;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  console.log("[CRON API] Request received at", new Date().toISOString());
  
  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.log("[CRON API] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON API] Authorized successfully");
  
  // Check required environment variables
  const envCheck = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
  };
  
  console.log("[CRON API] Environment check:", envCheck);
  
  if (!envCheck.GEMINI_API_KEY) {
    return NextResponse.json({
      error: "GEMINI_API_KEY not configured",
      envCheck
    }, { status: 500 });
  }
  
  if (!envCheck.DATABASE_URL) {
    return NextResponse.json({
      error: "DATABASE_URL not configured",
      envCheck
    }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "hourly";

  try {
    console.log(`📝 [CRON API] Generating ${type} post...`);

    // Select category based on type
    let selectedCategory: string;
    
    if (type === "trend") {
      const trendCategories = ["biznes", "texnologiya", "AI", "startaplar"];
      selectedCategory = trendCategories[Math.floor(Math.random() * trendCategories.length)];
    } else {
      selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    }
    
    console.log(`[CRON API] Selected category: ${selectedCategory}`);

    // Generate content using Gemini
    console.log("[CRON API] Calling Gemini API...");
    const generatedContent = await generateBlogPost(selectedCategory);
    console.log("[CRON API] Content generated:", generatedContent.title?.substring(0, 50));
    
    // Generate unique slug
    const slug = generateSlug(generatedContent.title);
    
    // Calculate read time
    const readTime = calculateReadTime(generatedContent.content);
    
    // Fetch image from Unsplash
    console.log("[CRON API] Fetching image...");
    const image = await fetchCategoryImage(selectedCategory);
    console.log(`🖼️ Image by ${image.author}`);

    // Save to database
    console.log("[CRON API] Saving to database...");
    const post = await prisma.blogPost.create({
      data: {
        category: selectedCategory,
        title: generatedContent.title,
        slug,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        seoTitle: generatedContent.seoTitle,
        seoDescription: generatedContent.seoDescription,
        keywords: generatedContent.keywords,
        imageUrl: image.url,
        readTime,
        status: "PUBLISHED",
      },
    });
    console.log("[CRON API] Blog post saved with ID:", post.id);

    // Track image download
    if (image.downloadUrl) {
      await trackImageDownload(image.downloadUrl);
    }

    // Send to Telegram channel
    const message = {
      title: post.title,
      content: post.excerpt,
      category: post.category,
      link: `/blog/${post.slug}`,
      imageUrl: post.imageUrl,
    };

    try {
      await sendToChannel(message);
      console.log(`📲 Sent to Telegram channel`);
    } catch (telegramError) {
      console.error("Telegram error (non-fatal):", telegramError);
    }

    // Notify subscribers
    try {
      await notifySubscribers(message);
    } catch (e) {
      console.error("Subscriber notification error (non-fatal):", e);
    }

    console.log(`✅ [CRON API] Published: "${post.title}" [${selectedCategory}]`);

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        category: post.category,
        slug: post.slug,
      },
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ [CRON API] Error:`, error);
    return NextResponse.json(
      { 
        error: "Failed to generate post", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
