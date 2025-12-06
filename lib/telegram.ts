import { Bot, Context, InlineQueryResultBuilder } from "grammy";
import { prisma } from "./prisma";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined");
}

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

export interface TelegramMessage {
  title: string;
  content: string;
  category?: string;
  link?: string;
  imageUrl?: string;
}

export async function sendToChannel(message: TelegramMessage): Promise<void> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId) {
    throw new Error("TELEGRAM_CHANNEL_ID is not defined");
  }

  const formattedMessage = formatBlogPostMessage(message);

  try {
    if (message.imageUrl) {
      await bot.api.sendPhoto(channelId, message.imageUrl, {
        caption: formattedMessage,
        parse_mode: "HTML",
      });
    } else {
      await bot.api.sendMessage(channelId, formattedMessage, {
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: false,
        },
      });
    }
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    throw error;
  }
}

// Send new post to all subscribers
export async function notifySubscribers(message: TelegramMessage): Promise<void> {
  try {
    const subscribers = await prisma.telegramSubscriber.findMany({
      where: { isActive: true },
    });

    const formattedMessage = formatBlogPostMessage(message);

    for (const sub of subscribers) {
      try {
        if (message.imageUrl) {
          await bot.api.sendPhoto(sub.chatId, message.imageUrl, {
            caption: formattedMessage,
            parse_mode: "HTML",
          });
        } else {
          await bot.api.sendMessage(sub.chatId, formattedMessage, {
            parse_mode: "HTML",
          });
        }
      } catch (err) {
        console.error(`Failed to notify ${sub.chatId}:`, err);
        // Mark as inactive if blocked
        await prisma.telegramSubscriber.update({
          where: { id: sub.id },
          data: { isActive: false },
        });
      }
    }
  } catch (error) {
    console.error("Error notifying subscribers:", error);
  }
}

function formatBlogPostMessage(message: TelegramMessage): string {
  const emoji = getCategoryEmoji(message.category || "");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://evolvoai-ysus.onrender.com";
  
  let formatted = `${emoji} <b>${message.title}</b>\n\n`;
  formatted += `${message.content}\n\n`;
  
  if (message.link) {
    formatted += `🔗 <a href="${baseUrl}${message.link}">To'liq o'qish</a>\n\n`;
  }
  
  if (message.category) {
    formatted += `#${message.category} #EvolvoAI`;
  }
  
  return formatted;
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    biznes: "💼",
    texnologiya: "💻",
    marketing: "📊",
    AI: "🤖",
    dasturlash: "👨‍💻",
    startaplar: "🚀",
    dizayn: "🎨",
    sotsiomedia: "📱",
    "e-commerce": "🛒",
    avtomatlashtirish: "⚙️",
    chatbotlar: "💬",
    SEO: "🔍",
  };
  
  return emojiMap[category] || "📝";
}

// Bot command handlers
export function setupBotCommands(): void {
  // /start command
  bot.command("start", async (ctx: Context) => {
    await ctx.reply(
      `👋 Xush kelibsiz! EvolvoAI Bot ga!\n\n` +
      `Biz AI texnologiyalari bilan biznesingizni avtomatlashtiramiz.\n\n` +
      `📌 Mavjud buyruqlar:\n` +
      `/subscribe - Yangi postlarga obuna bo'lish 🔔\n` +
      `/unsubscribe - Obunani bekor qilish\n` +
      `/random - Tasodifiy post olish 🎲\n` +
      `/services - Xizmatlar ro'yxati\n` +
      `/contact - Aloqa ma'lumotlari\n` +
      `/help - Yordam\n\n` +
      `💡 Inline rejim: @evolvoai_bot <qidiruv> yozing`,
      {
        reply_markup: {
          keyboard: [
            [{ text: "🔔 Obuna bo'lish" }, { text: "🎲 Tasodifiy post" }],
            [{ text: "🌐 Xizmatlar" }, { text: "📞 Aloqa" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  });

  // /subscribe command - Subscribe to new posts
  bot.command("subscribe", async (ctx: Context) => {
    const chatId = ctx.chat?.id.toString();
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;

    if (!chatId) {
      await ctx.reply("❌ Xato yuz berdi.");
      return;
    }

    try {
      // Check if already subscribed
      const existing = await prisma.telegramSubscriber.findUnique({
        where: { chatId },
      });

      if (existing) {
        if (existing.isActive) {
          await ctx.reply("✅ Siz allaqachon obuna bo'lgansiz! Yangi postlar kelganda xabar olasiz.");
        } else {
          // Reactivate
          await prisma.telegramSubscriber.update({
            where: { chatId },
            data: { isActive: true, lastActivity: new Date() },
          });
          await ctx.reply("🔔 Obuna qayta faollashtirildi! Yangi postlarni yana olasiz.");
        }
      } else {
        // New subscription
        await prisma.telegramSubscriber.create({
          data: {
            chatId,
            username,
            firstName,
            lastName,
          },
        });
        await ctx.reply(
          "🎉 Muvaffaqiyatli obuna bo'ldingiz!\n\n" +
          "Yangi blog postlar chiqganda sizga xabar yuboramiz.\n\n" +
          "Obunani bekor qilish: /unsubscribe"
        );
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      await ctx.reply("❌ Xato yuz berdi. Keyinroq urinib ko'ring.");
    }
  });

  // /unsubscribe command
  bot.command("unsubscribe", async (ctx: Context) => {
    const chatId = ctx.chat?.id.toString();

    if (!chatId) {
      await ctx.reply("❌ Xato yuz berdi.");
      return;
    }

    try {
      const existing = await prisma.telegramSubscriber.findUnique({
        where: { chatId },
      });

      if (existing && existing.isActive) {
        await prisma.telegramSubscriber.update({
          where: { chatId },
          data: { isActive: false },
        });
        await ctx.reply("👋 Obuna bekor qilindi. Yangi postlar haqida xabar olmaysiz.\n\nQayta obuna bo'lish: /subscribe");
      } else {
        await ctx.reply("ℹ️ Siz hali obuna bo'lmagansiz.\n\nObuna bo'lish: /subscribe");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      await ctx.reply("❌ Xato yuz berdi.");
    }
  });

  // /random command - Get random post
  bot.command("random", async (ctx: Context) => {
    try {
      // Get random published post
      const count = await prisma.blogPost.count({
        where: { status: "PUBLISHED" },
      });

      if (count === 0) {
        await ctx.reply("😢 Hozircha postlar yo'q. Tez orada qo'shamiz!");
        return;
      }

      const randomIndex = Math.floor(Math.random() * count);
      const posts = await prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        skip: randomIndex,
        take: 1,
      });

      const post = posts[0];
      if (!post) {
        await ctx.reply("❌ Post topilmadi.");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://evolvoai-ysus.onrender.com";
      const emoji = getCategoryEmoji(post.category);

      const message = 
        `🎲 <b>Tasodifiy Post:</b>\n\n` +
        `${emoji} <b>${post.title}</b>\n\n` +
        `${post.excerpt}\n\n` +
        `🔗 <a href="${baseUrl}/blog/${post.slug}">To'liq o'qish</a>\n\n` +
        `#${post.category} #EvolvoAI`;

      if (post.imageUrl) {
        await ctx.replyWithPhoto(post.imageUrl, {
          caption: message,
          parse_mode: "HTML",
        });
      } else {
        await ctx.reply(message, { parse_mode: "HTML" });
      }
    } catch (error) {
      console.error("Random post error:", error);
      await ctx.reply("❌ Xato yuz berdi. Keyinroq urinib ko'ring.");
    }
  });

  // /services command
  bot.command("services", async (ctx: Context) => {
    await ctx.reply(
      `🌐 <b>Bizning Xizmatlarimiz:</b>\n\n` +
      `1️⃣ <b>Web Sayt Yaratish</b>\n` +
      `   - Zamonaviy dizayn\n` +
      `   - SEO optimizatsiya\n` +
      `   - Responsive layout\n\n` +
      `2️⃣ <b>Telegram Bot</b>\n` +
      `   - Biznes avtomatlashtirish\n` +
      `   - CRM integratsiya\n` +
      `   - To'lov tizimlari\n\n` +
      `3️⃣ <b>AI Chatbot</b>\n` +
      `   - 24/7 mijoz xizmati\n` +
      `   - Tabiiy til\n` +
      `   - Ko'p tilda\n\n` +
      `4️⃣ <b>Avtomatlashtirish</b>\n` +
      `   - Workflow optimization\n` +
      `   - API integratsiya\n` +
      `   - Custom solutions\n\n` +
      `📞 Batafsil: @evolvoai`,
      { parse_mode: "HTML" }
    );
  });

  // /contact command
  bot.command("contact", async (ctx: Context) => {
    await ctx.reply(
      `📞 <b>Aloqa Ma'lumotlari:</b>\n\n` +
      `📧 Email: azizbekboy84@gmail.com\n` +
      `📱 Telefon: +998 99 644 84 44\n` +
      `🏠 Manzil: Toshkent, Nurafshon aylanma yo'li 12 uy\n` +
      `💬 Telegram: @evolvoai\n\n` +
      `Biz bilan bog'laning va loyihangizni muhokama qilamiz!`,
      { parse_mode: "HTML" }
    );
  });

  // /help command
  bot.command("help", async (ctx: Context) => {
    await ctx.reply(
      `❓ <b>Yordam:</b>\n\n` +
      `<b>Asosiy buyruqlar:</b>\n` +
      `/subscribe - Yangi postlarga obuna 🔔\n` +
      `/unsubscribe - Obunani bekor qilish\n` +
      `/random - Tasodifiy post 🎲\n` +
      `/services - Xizmatlar\n` +
      `/contact - Aloqa\n\n` +
      `<b>Inline rejim:</b>\n` +
      `Istalgan chatda @evolvoai_bot so'z yozing va postlarni qidiring!`,
      { parse_mode: "HTML" }
    );
  });

  // Text message handler (keyboard buttons)
  bot.on("message:text", async (ctx: Context) => {
    const text = ctx.message?.text || "";
    
    if (text === "🔔 Obuna bo'lish") {
      // Trigger subscribe command
      const chatId = ctx.chat?.id.toString();
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;
      const lastName = ctx.from?.last_name;

      if (chatId) {
        try {
          const existing = await prisma.telegramSubscriber.findUnique({ where: { chatId } });
          if (existing?.isActive) {
            await ctx.reply("✅ Siz allaqachon obuna bo'lgansiz!");
          } else if (existing) {
            await prisma.telegramSubscriber.update({ where: { chatId }, data: { isActive: true } });
            await ctx.reply("🔔 Obuna qayta faollashtirildi!");
          } else {
            await prisma.telegramSubscriber.create({ data: { chatId, username, firstName, lastName } });
            await ctx.reply("🎉 Muvaffaqiyatli obuna bo'ldingiz!");
          }
        } catch (e) {
          await ctx.reply("❌ Xato yuz berdi.");
        }
      }
    } else if (text === "🎲 Tasodifiy post") {
      // Trigger random command logic
      try {
        const count = await prisma.blogPost.count({ where: { status: "PUBLISHED" } });
        if (count === 0) {
          await ctx.reply("😢 Postlar hali yo'q.");
          return;
        }
        const posts = await prisma.blogPost.findMany({
          where: { status: "PUBLISHED" },
          skip: Math.floor(Math.random() * count),
          take: 1,
        });
        const post = posts[0];
        if (post) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://evolvoai-ysus.onrender.com";
          const msg = `🎲 <b>${post.title}</b>\n\n${post.excerpt}\n\n🔗 <a href="${baseUrl}/blog/${post.slug}">O'qish</a>`;
          if (post.imageUrl) {
            await ctx.replyWithPhoto(post.imageUrl, { caption: msg, parse_mode: "HTML" });
          } else {
            await ctx.reply(msg, { parse_mode: "HTML" });
          }
        }
      } catch (e) {
        await ctx.reply("❌ Xato yuz berdi.");
      }
    } else if (text === "🌐 Xizmatlar") {
      await ctx.reply("Xizmatlar ro'yxati uchun /services bosing");
    } else if (text === "📞 Aloqa") {
      await ctx.reply("Aloqa ma'lumotlari uchun /contact bosing");
    }
  });

  // INLINE MODE - Search posts in any chat
  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery?.query || "";
    
    try {
      let posts;
      if (query.length < 2) {
        // Show recent posts if no query
        posts = await prisma.blogPost.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { publishDate: "desc" },
          take: 10,
        });
      } else {
        // Search posts
        posts = await prisma.blogPost.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://evolvoai-ysus.onrender.com";

      const results = posts.map((post) => 
        InlineQueryResultBuilder.article(post.id, post.title, {
          description: post.excerpt.substring(0, 100) + "...",
          thumbnail_url: post.imageUrl || undefined,
        }).text(
          `${getCategoryEmoji(post.category)} <b>${post.title}</b>\n\n` +
          `${post.excerpt}\n\n` +
          `🔗 <a href="${baseUrl}/blog/${post.slug}">To'liq o'qish</a>\n\n` +
          `#${post.category} #EvolvoAI`,
          { parse_mode: "HTML" }
        )
      );

      await ctx.answerInlineQuery(results, { cache_time: 60 });
    } catch (error) {
      console.error("Inline query error:", error);
      await ctx.answerInlineQuery([]);
    }
  });
}

export async function startBot(): Promise<void> {
  setupBotCommands();
  
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  await bot.start();
  console.log("Telegram bot is running...");
}

export { bot };

