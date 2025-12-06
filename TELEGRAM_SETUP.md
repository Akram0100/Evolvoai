# Telegram Bot va Kanal Sozlash Qo'llanmasi

**EvolvoAI** loyihasi Telegram bilan chuqur integratsiya qilingan. Bu ikkita narsani anglatadi:
1. **Telegram Bot:** Saytdan kelgan xabarlarni (contact form) sizga yetkazadi.
2. **Telegram Kanal:** Saytda yangi maqola chiqsa, avtomatik kanalga joylaydi.

Ushbu funksiyalarni ishga tushirish uchun `.env` faylini to'ldirish kerak.

---

## 1. Telegram Bot Yaratish (Token olish)

1. Telegramda **[@BotFather](https://t.me/BotFather)** ni qidiring va kiring.
2. `/newbot` buyrug'ini yuboring.
3. Botga ism bering (masalan: `EvolvoAI Bot`).
4. Botga username bering (oxiri `bot` bilan tugashi shart, masalan: `evolvoai_uz_bot`).
5. BotFather sizga **TOKEN** beradi (masalan: `7123456789:AAF...`).
6. Ushbu tokenni nusxalab oling.

**Loyiha sozlamasi:**
`.env` faylini oching va `TELEGRAM_BOT_TOKEN` ga yozing:
```env
TELEGRAM_BOT_TOKEN="sizning_bot_tokeningiz"
```

---

## 2. Admin ID Olish (Xabarlarni qabul qilish uchun)

Saytdan kimdir yozsa, xabar aynan sizga kelishi kerak. Buning uchun sizning Telegram ID raqamingiz kerak.

1. Telegramda **[@userinfobot](https://t.me/userinfobot)** ni qidiring va `/start` bosing.
2. U sizga `Id: 123456789` deb javob beradi.
3. Shu raqamni nusxalab oling.

**Loyiha sozlamasi:**
`.env` faylida `TELEGRAM_ADMIN_ID` ga yozing:
```env
TELEGRAM_ADMIN_ID="123456789"
```

---

## 3. Kanal Sozlash (Avto-post uchun)

Agar saytga chiqqan maqolalar kanalingizga ham chiqishini istasangiz:

1. O'z kanalingizga yarating yoki boriga kiring.
2. Yuqorida yaratgan **Botingizni kanalga Admin qiling** (buning uchun kanal sozlamalariga kirib, Administrators bo'limidan botni qo'shasiz).
3. Kanalning linkini (username) oling (masalan: `@evolvoai_news`).

**Loyiha sozlamasi:**
`.env` faylida `TELEGRAM_CHANNEL_ID` ga yozing:
```env
TELEGRAM_CHANNEL_ID="@sizning_kanalingiz"
```

---

## 4. Yakuniy Natija

Sizning `.env` faylingiz taxminan shunday ko'rinishi kerak:

```env
TELEGRAM_BOT_TOKEN="789456123:AAHdqTcv..."
TELEGRAM_ADMIN_ID="99887766"
TELEGRAM_CHANNEL_ID="@mening_kanalim"
```

O'zgarishlarni saqlagandan so'ng, serverni o'chirib qayta yoqing:
1. Terminalda `Ctrl + C` bosing.
2. `npm run dev` ni qaytadan yozing.

Endi saytdan "Aloqa" formasini to'ldirib ko'ring, xabar bot orqali sizga keladi! 🚀
