import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: `${post.title} | EvolvoAI AMP`,
    description: post.seoDescription,
  };
}

export default async function AMPBlogPage({ params }: PageProps) {
  const post = await prisma.blogPost.findFirst({
    where: { 
      slug: params.slug,
      status: "PUBLISHED" 
    },
  });

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://evolvoai-ysus.onrender.com";

  // AMP HTML - simplified, fast-loading version
  const ampHtml = `
<!doctype html>
<html amp lang="uz">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>${post.title} | EvolvoAI</title>
  <link rel="canonical" href="${baseUrl}/blog/${post.slug}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${post.seoDescription}">
  
  <!-- AMP Boilerplate -->
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  
  <!-- Custom AMP Styles -->
  <style amp-custom>
    :root {
      --primary: #6366f1;
      --bg: #0a0a0a;
      --text: #ffffff;
      --muted: #a1a1aa;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
      line-height: 1.7;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      padding: 20px 0;
      border-bottom: 1px solid #333;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: var(--primary);
      text-decoration: none;
    }
    .category {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 32px;
      line-height: 1.2;
      margin: 0 0 16px 0;
    }
    .meta {
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 24px;
    }
    .content {
      font-size: 18px;
    }
    .content h2 {
      font-size: 24px;
      margin-top: 32px;
    }
    .content p {
      margin: 16px 0;
    }
    .content ul, .content ol {
      padding-left: 24px;
    }
    .content li {
      margin: 8px 0;
    }
    .cta {
      background: linear-gradient(135deg, var(--primary), #8b5cf6);
      color: white;
      padding: 24px;
      border-radius: 16px;
      margin-top: 40px;
      text-align: center;
    }
    .cta a {
      color: white;
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      background: white;
      color: var(--primary);
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 16px;
    }
    footer {
      margin-top: 60px;
      padding: 30px 0;
      border-top: 1px solid #333;
      text-align: center;
      color: var(--muted);
    }
    footer a {
      color: var(--primary);
    }
  </style>

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${post.title}",
    "description": "${post.seoDescription}",
    "image": "${post.imageUrl}",
    "datePublished": "${post.publishDate.toISOString()}",
    "author": {
      "@type": "Organization",
      "name": "EvolvoAI"
    }
  }
  </script>
</head>
<body>
  <div class="container">
    <header>
      <a href="${baseUrl}" class="logo">⚡ EvolvoAI</a>
    </header>

    <article>
      <span class="category">${post.category}</span>
      <h1>${post.title}</h1>
      <div class="meta">
        📅 ${new Date(post.publishDate).toLocaleDateString('uz-UZ')} · ⏱️ ${post.readTime} daqiqa o'qish
      </div>

      ${post.imageUrl ? `
      <amp-img 
        src="${post.imageUrl}" 
        width="800" 
        height="450" 
        layout="responsive"
        alt="${post.title}">
      </amp-img>
      ` : ''}

      <div class="content">
        ${post.content}
      </div>

      <div class="cta">
        <h3>🔔 Yangi maqolalar haqida xabardor bo'ling!</h3>
        <p>Telegram kanalimizga obuna bo'ling</p>
        <a href="https://t.me/evolvoaichannel" class="btn">📲 Obuna bo'lish</a>
      </div>
    </article>

    <footer>
      <p>© 2025 EvolvoAI. Barcha huquqlar himoyalangan.</p>
      <p><a href="${baseUrl}/blog/${post.slug}">To'liq versiyani ko'rish →</a></p>
    </footer>
  </div>
</body>
</html>
  `.trim();

  return new Response(ampHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "AMP-Access-Control-Allow-Source-Origin": baseUrl,
    },
  });
}
