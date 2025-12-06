require('dotenv').config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

console.log("🔍 Unsplash API Test\n");
console.log("Key exists:", !!UNSPLASH_ACCESS_KEY);
console.log("Key preview:", UNSPLASH_ACCESS_KEY ? UNSPLASH_ACCESS_KEY.substring(0, 8) + "..." : "NOT SET");

async function testUnsplash() {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("❌ UNSPLASH_ACCESS_KEY not found in .env");
    return;
  }

  try {
    const response = await fetch(
      "https://api.unsplash.com/photos/random?query=technology",
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    console.log("\n📡 API Response Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Unsplash API ishladi!");
      console.log("   Photo ID:", data.id);
      console.log("   Author:", data.user.name);
      console.log("   URL:", data.urls.small);
    } else {
      const errorText = await response.text();
      console.log("❌ Xato:", response.status, response.statusText);
      console.log("   Details:", errorText);
      
      if (response.status === 401) {
        console.log("\n⚠️  Kalit noto'g'ri yoki faollashtirilmagan!");
      } else if (response.status === 403) {
        console.log("\n⚠️  Ruxsat rad etildi - limit tugagan yoki kalit bloklangan!");
      }
    }
  } catch (error) {
    console.log("❌ Network xatosi:", error.message);
  }
}

testUnsplash();
