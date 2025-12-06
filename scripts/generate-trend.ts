
import "dotenv/config";
import { generateTrendingPost } from "../lib/gemini-trend";
import { prisma } from "../lib/prisma";
import { generateSlug, calculateReadTime } from "../lib/utils";
import { fetchCategoryImage, trackImageDownload } from "../lib/unsplash";
import { sendToChannel } from "../lib/telegram";

const categories = [
  "biznes", "texnologiya", "marketing", "AI", "startaplar"
];

async function generateTrend(category: string) {
  console.log(`\n🔥 Generating TRENDING post for category: ${category}`);
  
  try {
    // 1. Generate Trend Content
    const content = await generateTrendingPost(category);
    
    // 2. Fetch Image based on POST KEYWORDS (not just category)
    console.log("   🖼️  Fetching topic-relevant image...");
    // Use first 2 keywords for more relevant image search
    const searchQuery = content.keywords && content.keywords.length > 0 
      ? content.keywords.slice(0, 2).join(" ") 
      : category;
    console.log(`   🔍 Search query: "${searchQuery}"`);
    
    // Import searchImages for keyword-based search
    const { searchImages } = await import("../lib/unsplash");
    let image;
    const searchResults = await searchImages(searchQuery, 1, 5);
    if (searchResults.length > 0) {
      // Pick random from top 5 results
      image = searchResults[Math.floor(Math.random() * searchResults.length)];
    } else {
      // Fallback to category-based
      image = await fetchCategoryImage(category);
    }
    
    // 3. Save to DB
    const post = await prisma.blogPost.create({
      data: {
        category,
        title: content.title,
        slug: generateSlug(content.title) + "-trend", // Add suffix to avoid conflicts
        excerpt: content.excerpt,
        content: content.content,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        keywords: content.keywords,
        imageUrl: image.url,
        readTime: calculateReadTime(content.content),
        status: "PUBLISHED",
      },
    });

    if (image.downloadUrl) await trackImageDownload(image.downloadUrl);

    // 4. Send to Telegram
    console.log("   📨 Sending to Telegram...");
    try {
      await sendToChannel({
        title: `🔥 ${post.title}`,
        content: `${post.excerpt}\n\n⚡️ #Trend #Yangilik`,
        category: post.category,
        link: `/blog/${post.id}`,
        imageUrl: post.imageUrl || undefined,
      });
      console.log("   ✅ Sent to Telegram!");
    } catch (err) {
      console.error("   ⚠️ Telegram error:", err);
    }

    console.log(`✅ Success: ${post.title}`);
    return post;

  } catch (error) {
    console.error(`❌ Failed for ${category}:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🚀 Starting Bulk Trend Generation...");
    for (const cat of categories) {
      await generateTrend(cat);
      await new Promise(r => setTimeout(r, 5000));
    }
  } else {
    // Specific category
    await generateTrend(args[0]);
  }
}

main();
