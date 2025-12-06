#!/usr/bin/env ts-node

/**
 * Manual Content Generation Script
 * Run this to manually generate blog posts without waiting for cron
 */

import "dotenv/config";
import { generateBlogPost, categories } from "../lib/gemini";
import { prisma } from "../lib/prisma";
import { generateSlug, calculateReadTime } from "../lib/utils";
import { fetchCategoryImage, trackImageDownload } from "../lib/unsplash";
import { sendToChannel } from "../lib/telegram";

async function generatePost(category: string) {
  console.log(`\n📝 Generating post for category: ${category}`);
  
  try {
    // Generate content with AI
    console.log("   🤖 Generating content with Gemini AI...");
    const content = await generateBlogPost(category);
    
    // Fetch unique image from Unsplash
    console.log("   🖼️  Fetching image from Unsplash...");
    const image = await fetchCategoryImage(category);
    console.log(`   ✓ Image: ${image.url}`);
    console.log(`   ✓ By: ${image.author}`);
    
    // Create blog post
    const post = await prisma.blogPost.create({
      data: {
        category,
        title: content.title,
        slug: generateSlug(content.title),
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
    
    // Track download (Unsplash API requirement)
    if (image.downloadUrl) {
      await trackImageDownload(image.downloadUrl);
    }

    // Send to Telegram channel
    console.log("   📨 Sending to Telegram channel...");
    try {
      await sendToChannel({
        title: post.title,
        content: post.excerpt,
        category: post.category,
        link: `/blog/${post.id}`, // Using internal link, can be updated to full URL
        imageUrl: post.imageUrl || undefined,
      });
      console.log("   ✅ Sent to Telegram!");
    } catch (err) {
      console.error("   ⚠️ Failed to send to Telegram:", err);
    }
    
    console.log(`✅ Post created successfully!`);
    console.log(`   Title: ${post.title}`);
    console.log(`   ID: ${post.id}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Image: ${image.author} on Unsplash`);
    
    return post;
  } catch (error) {
    console.error(`❌ Error generating post for ${category}:`, error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🤖 Generating posts for all categories...\n");
    
    for (const category of categories) {
      try {
        await generatePost(category);
      } catch (err) {
        console.error(`⚠️ Skipping ${category} due to error.`);
      }
      // Wait 5 seconds between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } else {
    const category = args[0];
    if (!categories.includes(category)) {
      console.error(`❌ Invalid category: ${category}`);
      console.log(`Available categories: ${categories.join(", ")}`);
      process.exit(1);
    }
    
    await generatePost(category);
  }
  
  console.log("\n✅ Content generation completed!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
