# EvolvoAI - VPS Deploy Guide (Beget/Ubuntu)

Ushbu qo'llanma orqali **EvolvoAI** loyihasini **Beget VPS** yoki har qanday **Ubuntu** serveriga deploy qilishingiz mumkin.

## 1. Serverni Tayyorlash

Serverga SSH orqali kiring:
```bash
ssh root@sizning_server_ip
```

### Node.js o'rnatish (v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PostgreSQL o'rnatish
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
```

Database va foydalanuvchi yaratish:
```bash
sudo -u postgres psql

# SQL ichida:
CREATE DATABASE evolvoai;
CREATE USER evolvoai_user WITH ENCRYPTED PASSWORD 'kuchli_parol_yozing';
GRANT ALL PRIVILEGES ON DATABASE evolvoai TO evolvoai_user;
\q
```

## 2. Loyihani Yuklash

```bash
# Git o'rnatish
sudo apt install git -y

# Loyihani klonlash
cd /var/www
git clone https://github.com/optimbazar-ai/evolvoai.git
cd evolvoai

# Dependency'larni o'rnatish
npm install
```

## 3. Environment Variables

`.env` faylini yarating:
```bash
nano .env
```

Quyidagilarni yozing (o'zingizning ma'lumotlaringiz bilan):
```env
DATABASE_URL="postgresql://evolvoai_user:kuchli_parol_yozing@localhost:5432/evolvoai"
NEXTAUTH_URL="http://sizning-domeningiz.com"
NEXTAUTH_SECRET="uzun_random_string"
GEMINI_API_KEY="sizning_gemini_key"
TELEGRAM_BOT_TOKEN="sizning_bot_token"
TELEGRAM_CHANNEL_ID="@kanal_id"
TELEGRAM_ADMIN_ID="admin_id"
CRON_SECRET="random_cron_secret"
```
Saqlash uchun: `Ctrl+X`, keyin `Y`, keyin `Enter`.

## 4. Build va Database Setup

```bash
# Database schema yuklash
npx prisma db push

# Admin yaratish
node scripts/create-admin.js

# Boshlang'ich kontent (ixtiyoriy)
node scripts/seed-all-content.js

# Loyihani build qilish
npm run build
```

## 5. PM2 bilan Ishga Tushirish

PM2 - bu Node.js dasturlarini fonda ishlatish uchun manager.

```bash
# PM2 o'rnatish
sudo npm install -g pm2

# Dasturni ishga tushirish
pm2 start ecosystem.config.js

# Server restart bo'lganda avtomatik yonishini sozlash
pm2 startup
pm2 save
```

## 6. Nginx Sozlash (Reverse Proxy)

Nginx bizning port 3000 da ishlayotgan dasturimizni 80 (HTTP) portga ulaydi.

```bash
sudo apt install nginx -y
```

Config fayl yaratish:
```bash
sudo nano /etc/nginx/sites-available/evolvoai
```

Ichiga quyidagini yozing:
```nginx
server {
    listen 80;
    server_name sizning-domeningiz.com www.sizning-domeningiz.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Site ni faollashtirish:
```bash
sudo ln -s /etc/nginx/sites-available/evolvoai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. SSL Sertifikat (HTTPS)

Bepul SSL sertifikat olish (Certbot):

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d sizning-domeningiz.com
```

## 🎉 Tayyor!

Endi saytingiz `https://sizning-domeningiz.com` manzilida ishlaydi.

### Foydali Buyruqlar:

- Loglarni ko'rish: `pm2 logs evolvoai`
- Restart berish: `pm2 restart evolvoai`
- To'xtatish: `pm2 stop evolvoai`
