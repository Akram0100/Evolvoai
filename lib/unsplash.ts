/**
 * Unsplash API Integration
 * Free tier: 50 requests/hour
 */

export interface UnsplashImage {
  id: string;
  url: string;
  downloadUrl: string;
  author: string;
  authorUrl: string;
  width: number;
  height: number;
}

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

// Category-specific search queries for better relevance
const categoryQueries: Record<string, string[]> = {
  biznes: ["business meeting", "office workspace", "team collaboration", "corporate", "entrepreneur"],
  texnologiya: ["technology", "computer code", "circuit board", "innovation", "tech workspace"],
  marketing: ["marketing strategy", "social media", "analytics dashboard", "advertising", "digital marketing"],
  AI: ["artificial intelligence", "machine learning", "neural network", "robot technology", "AI concept"],
  dasturlash: ["programming", "code editor", "developer workspace", "software development", "coding"],
  startaplar: ["startup office", "innovation", "young entrepreneurs", "coworking space", "startup team"],
  dizayn: ["graphic design", "creative workspace", "design tools", "ui ux", "creative process"],
  sotsiomedia: ["social media icons", "smartphone social", "online communication", "content creation"],
  "e-commerce": ["online shopping", "e-commerce", "shopping cart", "retail technology", "digital store"],
  avtomatlashtirish: ["automation", "robotic process", "workflow", "smart technology", "industrial automation"],
  chatbotlar: ["chatbot interface", "customer support", "messaging app", "virtual assistant", "chat interface"],
  SEO: ["search engine", "seo optimization", "web analytics", "digital marketing", "search results"],
};

/**
 * Get a random search query for the category
 */
function getRandomQuery(category: string): string {
  const queries = categoryQueries[category] || ["technology", "business"];
  return queries[Math.floor(Math.random() * queries.length)];
}

/**
 * Fetch a random image from Unsplash based on category
 */
export async function fetchCategoryImage(category: string): Promise<UnsplashImage> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("UNSPLASH_ACCESS_KEY not set, using placeholder");
    return getPlaceholderImage(category);
  }

  const query = getRandomQuery(category);
  const randomPage = Math.floor(Math.random() * 10) + 1; // Random page 1-10 for variety
  
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&page=${randomPage}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status}`);
      return getPlaceholderImage(category);
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.urls.regular, // 1080px wide
      downloadUrl: data.links.download_location,
      author: data.user.name,
      authorUrl: data.user.links.html,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return getPlaceholderImage(category);
  }
}

/**
 * Trigger download tracking (required by Unsplash API guidelines)
 */
export async function trackImageDownload(downloadUrl: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY || !downloadUrl) return;

  try {
    await fetch(downloadUrl, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error("Error tracking image download:", error);
  }
}

/**
 * Fallback placeholder image if Unsplash is unavailable
 */
function getPlaceholderImage(category: string): UnsplashImage {
  // Use real working Unsplash placeholder images
  const placeholders: Record<string, string> = {
    biznes: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080&q=80",
    texnologiya: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&q=80",
    marketing: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1080&q=80",
    AI: "https://images.unsplash.com/photo-1677442135136-760c813028c0?w=1080&q=80",
    dasturlash: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1080&q=80",
    startaplar: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1080&q=80",
    dizayn: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1080&q=80",
    sotsiomedia: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1080&q=80",
    "e-commerce": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1080&q=80",
    avtomatlashtirish: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1080&q=80",
    chatbotlar: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1080&q=80",
    SEO: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1080&q=80",
  };
  
  const url = placeholders[category] || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&q=80";
  
  return {
    id: `placeholder-${category}`,
    url: url,
    downloadUrl: "",
    author: "Unsplash",
    authorUrl: "https://unsplash.com",
    width: 1080,
    height: 720,
  };
}

/**
 * Get multiple unique images for a category
 */
export async function fetchMultipleCategoryImages(
  category: string,
  count: number = 3
): Promise<UnsplashImage[]> {
  const images: UnsplashImage[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const image = await fetchCategoryImage(category);
    
    // Avoid duplicates
    if (!usedIds.has(image.id)) {
      images.push(image);
      usedIds.add(image.id);
    }
    
    // Small delay to avoid rate limiting
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return images;
}

/**
 * Search images with specific query
 */
export async function searchImages(
  query: string,
  page: number = 1,
  perPage: number = 10
): Promise<UnsplashImage[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      downloadUrl: photo.links.download_location,
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    }));
  } catch (error) {
    console.error("Error searching Unsplash images:", error);
    return [];
  }
}
