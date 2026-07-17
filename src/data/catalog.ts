import type { CurrencyCode } from "@/domain/common";
import type { Brand, Category } from "@/domain/catalog";
import type { DynamicTopUpField } from "@/domain/forms";
import type { DirectTopUpProduct, GiftCardProduct, Product } from "@/domain/product";

export type { Brand, Category } from "@/domain/catalog";

type ProductSeed = {
  id: string;
  brandId: string;
  categoryId: string;
  title: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  platform?: string;
  region: string;
  denominations?: number[]; // gift card values
  requiresPlayerId?: boolean;
  requiresServer?: boolean;
  price: number; // starting price
  compareAt?: number;
  currency: CurrencyCode;
  rating: number;
  reviewsCount: number;
  instant: boolean;
  inStock: boolean;
  tags?: string[]; // "bestseller" | "new" | "offer"
  description: { en: string; ar: string };
  redeem: { en: string; ar: string };
  restrictions?: { en: string; ar: string };
  packages?: { id: string; label: string; amount: number; price: number }[];
  color: string; // hex or gradient
};

export const categories: Category[] = [
  {
    id: "gift-cards",
    name: { en: "Gift Cards", ar: "بطاقات هدايا" },
    icon: "🎁",
    color: "#3b82f6",
  },
  { id: "top-ups", name: { en: "Game Top-Ups", ar: "شحن ألعاب" }, icon: "🎮", color: "#06b6d4" },
  { id: "playstation", name: { en: "PlayStation", ar: "بلايستيشن" }, icon: "🎯", color: "#0ea5e9" },
  { id: "xbox", name: { en: "Xbox", ar: "إكس بوكس" }, icon: "🕹️", color: "#10b981" },
  { id: "steam", name: { en: "Steam", ar: "ستيم" }, icon: "💨", color: "#64748b" },
  { id: "nintendo", name: { en: "Nintendo", ar: "نينتندو" }, icon: "🍄", color: "#ef4444" },
  { id: "pc", name: { en: "PC Games", ar: "ألعاب PC" }, icon: "🖥️", color: "#8b5cf6" },
  { id: "mobile", name: { en: "Mobile Games", ar: "ألعاب جوال" }, icon: "📱", color: "#ec4899" },
  { id: "entertainment", name: { en: "Entertainment", ar: "ترفيه" }, icon: "🎬", color: "#f59e0b" },
  { id: "shopping", name: { en: "Shopping", ar: "تسوق" }, icon: "🛍️", color: "#22c55e" },
  { id: "streaming", name: { en: "Streaming", ar: "بث" }, icon: "📺", color: "#e11d48" },
  {
    id: "wallets",
    name: { en: "Digital Wallets", ar: "محافظ رقمية" },
    icon: "💳",
    color: "#14b8a6",
  },
  { id: "subs", name: { en: "Subscriptions", ar: "اشتراكات" }, icon: "✨", color: "#a855f7" },
];

export const brands: Brand[] = [
  { id: "playstation", name: "PlayStation", color: "#0070d1", logo: "🎯" },
  { id: "xbox", name: "Xbox", color: "#107c10", logo: "🕹️" },
  { id: "steam", name: "Steam", color: "#1b2838", logo: "💨" },
  { id: "nintendo", name: "Nintendo", color: "#e60012", logo: "🍄" },
  { id: "apple", name: "Apple", color: "#111", logo: "" },
  { id: "google", name: "Google Play", color: "#0f9d58", logo: "▶️" },
  { id: "amazon", name: "Amazon", color: "#ff9900", logo: "📦" },
  { id: "netflix", name: "Netflix", color: "#e50914", logo: "N" },
  { id: "spotify", name: "Spotify", color: "#1db954", logo: "♫" },
  { id: "roblox", name: "Roblox", color: "#e2231a", logo: "R" },
  { id: "minecraft", name: "Minecraft", color: "#5b8731", logo: "▣" },
  { id: "riot", name: "Riot Games", color: "#d13639", logo: "R" },
  { id: "valorant", name: "Valorant", color: "#ff4655", logo: "V" },
  { id: "lol", name: "League of Legends", color: "#c8aa6e", logo: "L" },
  { id: "pubg", name: "PUBG Mobile", color: "#f2a900", logo: "P" },
  { id: "freefire", name: "Free Fire", color: "#ff6a00", logo: "F" },
  { id: "fortnite", name: "Fortnite", color: "#9d4dff", logo: "◆" },
  { id: "cod", name: "Call of Duty", color: "#0b5c1f", logo: "C" },
  { id: "eafc", name: "EA Sports FC", color: "#0e2c5a", logo: "⚽" },
  { id: "mlbb", name: "Mobile Legends", color: "#1a3b8f", logo: "M" },
  { id: "genshin", name: "Genshin Impact", color: "#4a7bd0", logo: "G" },
  { id: "hsr", name: "Honkai: Star Rail", color: "#8a5cf6", logo: "H" },
  { id: "whiteout", name: "Whiteout Survival", color: "#3a6ea5", logo: "W" },
];

const P = (
  p: Partial<ProductSeed> &
    Pick<
      ProductSeed,
      "id" | "brandId" | "categoryId" | "title" | "price" | "color" | "description" | "redeem"
    >,
): ProductSeed => ({
  region: "Global",
  currency: "SAR",
  rating: 4.7,
  reviewsCount: 1200,
  instant: true,
  inStock: true,
  ...p,
});

const productSeeds: ProductSeed[] = [
  P({
    id: "psn-100",
    brandId: "playstation",
    categoryId: "playstation",
    title: { en: "PlayStation Store Card", ar: "بطاقة متجر بلايستيشن" },
    subtitle: { en: "PSN Wallet", ar: "محفظة PSN" },
    platform: "PSN",
    region: "KSA",
    denominations: [50, 100, 200, 500],
    price: 50,
    color: "#0070d1",
    tags: ["bestseller"],
    description: {
      en: "Add funds to your PlayStation Network wallet for games, DLC, and subscriptions.",
      ar: "أضف رصيداً إلى محفظة بلايستيشن نتورك لشراء الألعاب والمحتوى الإضافي والاشتراكات.",
    },
    redeem: {
      en: "Sign in to PSN → Redeem Codes → enter the 12-digit code.",
      ar: "سجل الدخول إلى PSN ← استخدام رمز ← أدخل الرمز المكون من 12 خانة.",
    },
    restrictions: { en: "KSA accounts only.", ar: "حسابات المملكة فقط." },
  }),
  P({
    id: "xbox-50",
    brandId: "xbox",
    categoryId: "xbox",
    title: { en: "Xbox Gift Card", ar: "بطاقة إكس بوكس" },
    platform: "Xbox",
    region: "KSA",
    denominations: [50, 100, 200],
    price: 50,
    color: "#107c10",
    description: {
      en: "Use on Xbox Store, games, apps and more.",
      ar: "استخدمها في متجر إكس بوكس والألعاب والتطبيقات.",
    },
    redeem: { en: "Xbox app → Redeem Code.", ar: "تطبيق إكس بوكس ← استخدام رمز." },
  }),
  P({
    id: "steam-100",
    brandId: "steam",
    categoryId: "steam",
    title: { en: "Steam Wallet Code", ar: "رمز محفظة ستيم" },
    platform: "Steam",
    region: "Global",
    denominations: [20, 50, 100, 200],
    price: 20,
    color: "#1b2838",
    tags: ["new"],
    description: { en: "Add funds to your Steam wallet.", ar: "أضف رصيداً إلى محفظة ستيم." },
    redeem: {
      en: "Steam client → +Add funds → Redeem.",
      ar: "برنامج ستيم ← إضافة رصيد ← استخدام رمز.",
    },
  }),
  P({
    id: "apple-100",
    brandId: "apple",
    categoryId: "wallets",
    title: { en: "Apple Gift Card", ar: "بطاقة آبل" },
    platform: "App Store",
    denominations: [50, 100, 200, 500],
    price: 50,
    color: "#0a0a0a",
    description: {
      en: "For Apps, Music, iCloud+ and more.",
      ar: "للتطبيقات والموسيقى وiCloud+ والمزيد.",
    },
    redeem: { en: "App Store → Redeem Gift Card.", ar: "متجر التطبيقات ← استخدام بطاقة هدية." },
  }),
  P({
    id: "googleplay-50",
    brandId: "google",
    categoryId: "wallets",
    title: { en: "Google Play Card", ar: "بطاقة جوجل بلاي" },
    platform: "Google Play",
    denominations: [25, 50, 100, 200],
    price: 25,
    color: "#0f9d58",
    description: {
      en: "Buy apps, games and content on Google Play.",
      ar: "اشتر التطبيقات والألعاب والمحتوى على جوجل بلاي.",
    },
    redeem: { en: "Play Store → Redeem code.", ar: "متجر بلاي ← استخدام رمز." },
  }),
  P({
    id: "netflix-100",
    brandId: "netflix",
    categoryId: "streaming",
    title: { en: "Netflix Gift Card", ar: "بطاقة نتفليكس" },
    denominations: [100, 200],
    price: 100,
    color: "#e50914",
    description: { en: "Give the gift of Netflix.", ar: "أهدِ اشتراك نتفليكس." },
    redeem: { en: "netflix.com/redeem", ar: "netflix.com/redeem" },
  }),
  P({
    id: "spotify-6m",
    brandId: "spotify",
    categoryId: "subs",
    title: { en: "Spotify Premium 3M", ar: "سبوتيفاي بريميوم 3 أشهر" },
    price: 45,
    compareAt: 60,
    color: "#1db954",
    tags: ["offer"],
    description: { en: "3 months of Spotify Premium.", ar: "3 أشهر من سبوتيفاي بريميوم." },
    redeem: { en: "spotify.com/redeem", ar: "spotify.com/redeem" },
  }),
  P({
    id: "pubg-uc",
    brandId: "pubg",
    categoryId: "mobile",
    title: { en: "PUBG Mobile UC", ar: "شدات ببجي موبايل" },
    platform: "PUBG Mobile",
    price: 5,
    color: "#f2a900",
    requiresPlayerId: true,
    tags: ["bestseller"],
    packages: [
      { id: "uc-60", label: "60 UC", amount: 60, price: 5 },
      { id: "uc-325", label: "325 UC", amount: 325, price: 22 },
      { id: "uc-660", label: "660 UC", amount: 660, price: 42 },
      { id: "uc-1800", label: "1800 UC", amount: 1800, price: 110 },
      { id: "uc-3850", label: "3850 UC", amount: 3850, price: 220 },
      { id: "uc-8100", label: "8100 UC", amount: 8100, price: 440 },
    ],
    description: {
      en: "Top up PUBG Mobile UC directly to your account.",
      ar: "اشحن شدات ببجي موبايل مباشرة على حسابك.",
    },
    redeem: {
      en: "Delivered directly to your Player ID.",
      ar: "يتم الشحن مباشرة إلى معرّف اللاعب.",
    },
  }),
  P({
    id: "freefire-diamonds",
    brandId: "freefire",
    categoryId: "mobile",
    title: { en: "Free Fire Diamonds", ar: "جواهر فري فاير" },
    price: 5,
    color: "#ff6a00",
    requiresPlayerId: true,
    packages: [
      { id: "ff-100", label: "100 💎", amount: 100, price: 5 },
      { id: "ff-310", label: "310 💎", amount: 310, price: 15 },
      { id: "ff-520", label: "520 💎", amount: 520, price: 25 },
      { id: "ff-1060", label: "1060 💎", amount: 1060, price: 50 },
      { id: "ff-2180", label: "2180 💎", amount: 2180, price: 100 },
    ],
    description: { en: "Top up Free Fire Diamonds instantly.", ar: "اشحن جواهر فري فاير فوراً." },
    redeem: { en: "Delivered to your Player ID.", ar: "يتم الشحن إلى معرّف اللاعب." },
  }),
  P({
    id: "mlbb-diamonds",
    brandId: "mlbb",
    categoryId: "mobile",
    title: { en: "Mobile Legends Diamonds", ar: "جواهر موبايل ليجندز" },
    price: 5,
    color: "#1a3b8f",
    requiresPlayerId: true,
    requiresServer: true,
    packages: [
      { id: "ml-56", label: "56 💎", amount: 56, price: 5 },
      { id: "ml-278", label: "278 💎", amount: 278, price: 22 },
      { id: "ml-571", label: "571 💎", amount: 571, price: 42 },
      { id: "ml-1163", label: "1163 💎", amount: 1163, price: 82 },
    ],
    description: {
      en: "Direct top-up. Player ID + Server required.",
      ar: "شحن مباشر. مطلوب معرّف اللاعب والسيرفر.",
    },
    redeem: { en: "Delivered to your account.", ar: "يتم الشحن إلى حسابك." },
  }),
  P({
    id: "whiteout-fc",
    brandId: "whiteout",
    categoryId: "mobile",
    title: { en: "Whiteout Survival Firecrystals", ar: "بلورات نار وايت آوت سرفايفل" },
    platform: "Whiteout Survival",
    price: 5,
    color: "#3a6ea5",
    requiresPlayerId: true,
    requiresServer: true,
    tags: ["new"],
    packages: [
      { id: "wos-100", label: "100 🔥", amount: 100, price: 5 },
      { id: "wos-520", label: "520 🔥", amount: 520, price: 22 },
      { id: "wos-1060", label: "1060 🔥", amount: 1060, price: 42 },
      { id: "wos-2200", label: "2200 🔥", amount: 2200, price: 82 },
    ],
    description: {
      en: "Direct top-up. Player ID + State required.",
      ar: "شحن مباشر. مطلوب معرّف اللاعب والولاية.",
    },
    redeem: { en: "Delivered to your State.", ar: "يتم الشحن إلى ولايتك." },
  }),
  P({
    id: "genshin-crystals",
    brandId: "genshin",
    categoryId: "mobile",
    title: { en: "Genesis Crystals", ar: "بلورات جينشن" },
    price: 5,
    color: "#4a7bd0",
    requiresPlayerId: true,
    requiresServer: true,
    packages: [
      { id: "gc-60", label: "60", amount: 60, price: 5 },
      { id: "gc-330", label: "330", amount: 330, price: 22 },
      { id: "gc-1090", label: "1090", amount: 1090, price: 70 },
    ],
    description: { en: "Genshin Impact top-up.", ar: "شحن جينشن إمباكت." },
    redeem: { en: "Direct top-up.", ar: "شحن مباشر." },
  }),
  P({
    id: "roblox-800",
    brandId: "roblox",
    categoryId: "mobile",
    title: { en: "Roblox 800 Robux", ar: "روبلوكس 800 روبكس" },
    price: 40,
    color: "#e2231a",
    description: { en: "Redeem for Robux.", ar: "استخدم للحصول على روبكس." },
    redeem: { en: "roblox.com/redeem", ar: "roblox.com/redeem" },
  }),
  P({
    id: "valorant-vp",
    brandId: "valorant",
    categoryId: "pc",
    title: { en: "Valorant Points", ar: "نقاط فالورانت" },
    price: 20,
    color: "#ff4655",
    packages: [
      { id: "vp-475", label: "475 VP", amount: 475, price: 20 },
      { id: "vp-1000", label: "1000 VP", amount: 1000, price: 40 },
      { id: "vp-2050", label: "2050 VP", amount: 2050, price: 80 },
    ],
    description: {
      en: "Valorant Points for skins & Battle Pass.",
      ar: "نقاط فالورانت للأزياء وباص المعركة.",
    },
    redeem: { en: "Riot client → Store → Redeem.", ar: "برنامج رايوت ← المتجر ← استخدام رمز." },
  }),
  P({
    id: "fortnite-vbucks",
    brandId: "fortnite",
    categoryId: "pc",
    title: { en: "Fortnite V-Bucks", ar: "فورتنايت V-Bucks" },
    price: 25,
    color: "#9d4dff",
    denominations: [1000, 2800, 5000, 13500],
    description: { en: "Redeem V-Bucks in Fortnite.", ar: "استخدم V-Bucks في فورتنايت." },
    redeem: { en: "fortnite.com/vbuckscard", ar: "fortnite.com/vbuckscard" },
  }),
  P({
    id: "cod-points",
    brandId: "cod",
    categoryId: "mobile",
    title: { en: "Call of Duty Points", ar: "نقاط كول أوف ديوتي" },
    price: 20,
    color: "#0b5c1f",
    packages: [
      { id: "cp-500", label: "500 CP", amount: 500, price: 20 },
      { id: "cp-1100", label: "1100 CP", amount: 1100, price: 40 },
      { id: "cp-2400", label: "2400 CP", amount: 2400, price: 80 },
    ],
    description: { en: "COD Points top-up.", ar: "شحن نقاط كول أوف ديوتي." },
    redeem: { en: "Direct top-up.", ar: "شحن مباشر." },
  }),
  P({
    id: "eafc-points",
    brandId: "eafc",
    categoryId: "playstation",
    title: { en: "EA FC 24 Points", ar: "نقاط EA FC 24" },
    price: 35,
    color: "#0e2c5a",
    description: { en: "For FUT packs & content.", ar: "لحزم FUT والمحتوى." },
    redeem: { en: "Redeem on console.", ar: "استخدم على الجهاز." },
  }),
  P({
    id: "nintendo-50",
    brandId: "nintendo",
    categoryId: "nintendo",
    title: { en: "Nintendo eShop Card", ar: "بطاقة نينتندو" },
    denominations: [50, 100],
    price: 50,
    color: "#e60012",
    description: { en: "Add funds to Nintendo eShop.", ar: "أضف رصيداً إلى متجر نينتندو." },
    redeem: { en: "eShop → Enter Code.", ar: "المتجر ← أدخل الرمز." },
  }),
  P({
    id: "amazon-100",
    brandId: "amazon",
    categoryId: "shopping",
    title: { en: "Amazon Gift Card", ar: "بطاقة أمازون" },
    denominations: [50, 100, 200, 500],
    price: 50,
    color: "#ff9900",
    description: {
      en: "Shop millions of items on Amazon.",
      ar: "تسوق ملايين المنتجات على أمازون.",
    },
    redeem: { en: "amazon.sa/redeem", ar: "amazon.sa/redeem" },
  }),
  P({
    id: "hsr-oneiric",
    brandId: "hsr",
    categoryId: "mobile",
    title: { en: "Honkai: Star Rail Oneiric Shard", ar: "شظايا هونكاي" },
    price: 5,
    color: "#8a5cf6",
    requiresPlayerId: true,
    packages: [
      { id: "hsr-60", label: "60", amount: 60, price: 5 },
      { id: "hsr-330", label: "330", amount: 330, price: 22 },
    ],
    description: { en: "Direct top-up to your UID.", ar: "شحن مباشر على UID." },
    redeem: { en: "Direct top-up.", ar: "شحن مباشر." },
  }),
  P({
    id: "lol-rp",
    brandId: "lol",
    categoryId: "pc",
    title: { en: "League RP", ar: "نقاط League of Legends" },
    price: 20,
    color: "#c8aa6e",
    packages: [
      { id: "rp-650", label: "650 RP", amount: 650, price: 20 },
      { id: "rp-1380", label: "1380 RP", amount: 1380, price: 40 },
    ],
    description: { en: "Riot Points for LoL.", ar: "نقاط Riot لـ LoL." },
    redeem: { en: "Riot client redeem.", ar: "استخدام في برنامج رايوت." },
  }),
];

export function findBrand(id: string) {
  return brands.find((b) => b.id === id);
}
export function findCategory(id: string) {
  return categories.find((c) => c.id === id);
}

/**
 * Per-game field schemas. These are mock configurations only — no supplier or
 * backend is contacted. IDs, servers/zones and codes are forced LTR so they
 * render correctly in Arabic mode.
 */
const TOP_UP_FIELD_SCHEMAS: Record<string, DynamicTopUpField[]> = {
  "pubg-uc": [
    {
      type: "numeric_text",
      key: "playerId",
      label: { en: "Player ID", ar: "معرّف اللاعب" },
      placeholder: { en: "e.g. 5123456789", ar: "مثال: 5123456789" },
      helpText: {
        en: "Open PUBG Mobile → tap your profile to find your numeric ID.",
        ar: "افتح ببجي موبايل ← اضغط على ملفك الشخصي لإيجاد المعرّف الرقمي.",
      },
      required: true,
      direction: "ltr",
      normalization: { digitsOnly: true, trim: true },
      validation: {
        pattern: "[0-9]{8,12}",
        errorMessage: {
          en: "Player ID must be 8–12 digits",
          ar: "يجب أن يكون معرّف اللاعب بين 8 و12 رقماً",
        },
      },
    },
    {
      type: "info",
      key: "pubg-note",
      tone: "info",
      label: { en: "How delivery works", ar: "كيف يتم الشحن" },
      body: {
        en: "UC is credited directly to the Player ID above. Double-check it before paying.",
        ar: "تُضاف الشدات مباشرة إلى معرّف اللاعب أعلاه. تأكد منه قبل الدفع.",
      },
    },
  ],
  "freefire-diamonds": [
    {
      type: "numeric_text",
      key: "playerId",
      label: { en: "Player ID", ar: "معرّف اللاعب" },
      placeholder: { en: "e.g. 123456789", ar: "مثال: 123456789" },
      helpText: {
        en: "Your Free Fire numeric UID shown on your profile.",
        ar: "معرّف فري فاير الرقمي الظاهر في ملفك الشخصي.",
      },
      required: true,
      direction: "ltr",
      normalization: { digitsOnly: true, trim: true },
      validation: {
        pattern: "[0-9]{6,12}",
        errorMessage: {
          en: "Player ID must be 6–12 digits",
          ar: "يجب أن يكون معرّف اللاعب بين 6 و12 رقماً",
        },
      },
    },
    {
      type: "text",
      key: "nicknameHint",
      label: { en: "In-game nickname (optional)", ar: "الاسم داخل اللعبة (اختياري)" },
      placeholder: { en: "Helps us confirm the account", ar: "يساعدنا في تأكيد الحساب" },
      required: false,
      direction: "ltr",
      keyboard: "default",
      normalization: { trim: true },
      validation: {
        maxLength: 24,
        errorMessage: { en: "Max 24 characters", ar: "الحد الأقصى 24 حرفاً" },
      },
    },
  ],
  "mlbb-diamonds": [
    {
      type: "numeric_text",
      key: "playerId",
      label: { en: "User ID", ar: "معرّف المستخدم" },
      placeholder: { en: "e.g. 123456789", ar: "مثال: 123456789" },
      helpText: {
        en: "Shown in Profile as the first number.",
        ar: "يظهر في الملف الشخصي كأول رقم.",
      },
      required: true,
      direction: "ltr",
      normalization: { digitsOnly: true, trim: true },
      validation: {
        pattern: "[0-9]{6,12}",
        errorMessage: {
          en: "User ID must be 6–12 digits",
          ar: "يجب أن يكون معرّف المستخدم بين 6 و12 رقماً",
        },
      },
    },
    {
      type: "numeric_text",
      key: "zoneId",
      label: { en: "Zone ID", ar: "معرّف المنطقة" },
      placeholder: { en: "e.g. 1234", ar: "مثال: 1234" },
      helpText: {
        en: "The number shown in parentheses after your User ID.",
        ar: "الرقم الظاهر بين قوسين بعد معرّف المستخدم.",
      },
      required: true,
      direction: "ltr",
      normalization: { digitsOnly: true, trim: true },
      validation: {
        pattern: "[0-9]{3,6}",
        errorMessage: {
          en: "Zone ID must be 3–6 digits",
          ar: "يجب أن يكون معرّف المنطقة بين 3 و6 أرقام",
        },
      },
    },
    {
      type: "select",
      key: "server",
      label: { en: "Server region", ar: "منطقة السيرفر" },
      required: true,
      direction: "ltr",
      options: [
        { value: "asia", label: { en: "Asia", ar: "آسيا" } },
        { value: "sea", label: { en: "Southeast Asia", ar: "جنوب شرق آسيا" } },
        { value: "mena", label: { en: "MENA", ar: "الشرق الأوسط" } },
        { value: "europe", label: { en: "Europe", ar: "أوروبا" } },
        { value: "america", label: { en: "America", ar: "أمريكا" } },
      ],
    },
  ],
  "whiteout-fc": [
    {
      type: "numeric_text",
      key: "playerId",
      label: { en: "Player ID", ar: "معرّف اللاعب" },
      placeholder: { en: "e.g. 98765432", ar: "مثال: 98765432" },
      helpText: {
        en: "Tap your avatar → the ID is listed under your name.",
        ar: "اضغط على صورتك ← يظهر المعرّف أسفل اسمك.",
      },
      required: true,
      direction: "ltr",
      normalization: { digitsOnly: true, trim: true },
      validation: {
        pattern: "[0-9]{6,14}",
        errorMessage: {
          en: "Player ID must be 6–14 digits",
          ar: "يجب أن يكون معرّف اللاعب بين 6 و14 رقماً",
        },
      },
    },
    {
      type: "searchable_select",
      key: "state",
      label: { en: "State (server)", ar: "الولاية (السيرفر)" },
      required: true,
      direction: "ltr",
      searchPlaceholder: { en: "Search state number...", ar: "ابحث برقم الولاية..." },
      options: Array.from({ length: 20 }, (_, i) => {
        const n = i + 1;
        return {
          value: `state-${n}`,
          label: { en: `State #${n}`, ar: `الولاية #${n}` },
          keywords: [`${n}`, `state ${n}`, `s${n}`],
        };
      }),
    },
    {
      type: "radio",
      key: "platform",
      label: { en: "Platform", ar: "المنصة" },
      required: true,
      options: [
        { value: "ios", label: { en: "iOS", ar: "iOS" } },
        { value: "android", label: { en: "Android", ar: "أندرويد" } },
      ],
    },
    {
      type: "info",
      key: "whiteout-note",
      tone: "warning",
      label: { en: "Check your State", ar: "تحقق من الولاية" },
      body: {
        en: "Resources are delivered to the selected State. A wrong State cannot be refunded.",
        ar: "تُسلَّم الموارد إلى الولاية المختارة. لا يمكن استرداد ولاية خاطئة.",
      },
    },
  ],
};

const PLAYER_ID_FIELD: DynamicTopUpField = {
  type: "numeric_text",
  key: "playerId",
  label: { en: "Player ID", ar: "معرّف اللاعب" },
  placeholder: { en: "Enter your Player ID", ar: "أدخل معرّف اللاعب" },
  helpText: { en: "Numbers only", ar: "أرقام فقط" },
  required: true,
  direction: "ltr",
  normalization: { digitsOnly: true, trim: true },
  validation: {
    pattern: "[0-9]{5,15}",
    errorMessage: {
      en: "Player ID must be 5–15 digits",
      ar: "يجب أن يكون معرّف اللاعب بين 5 و15 رقماً",
    },
  },
};

const SERVER_FIELD: DynamicTopUpField = {
  type: "select",
  key: "server",
  label: { en: "Server", ar: "السيرفر" },
  required: true,
  direction: "ltr",
  options: [
    { value: "asia", label: { en: "Asia", ar: "آسيا" } },
    { value: "europe", label: { en: "Europe", ar: "أوروبا" } },
    { value: "america", label: { en: "America", ar: "أمريكا" } },
    { value: "sea", label: { en: "Southeast Asia", ar: "جنوب شرق آسيا" } },
  ],
};

function topUpFieldsFor(p: ProductSeed): DynamicTopUpField[] {
  const explicit = TOP_UP_FIELD_SCHEMAS[p.id];
  if (explicit) return explicit;

  const fields: DynamicTopUpField[] = [];
  if (p.requiresPlayerId) fields.push(PLAYER_ID_FIELD);
  if (p.requiresServer) fields.push(SERVER_FIELD);
  return fields;
}

function toProduct(p: ProductSeed): Product {
  const base = {
    id: p.id,
    brandId: p.brandId,
    categoryId: p.categoryId,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    color: p.color,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    inStock: p.inStock,
    tags: p.tags,
    fromPrice: p.price,
    compareAt: p.compareAt,
    displayCurrency: p.currency,
    region: {
      code: p.region.toUpperCase(),
      name: { en: p.region, ar: p.region },
    },
  };
  if (p.requiresPlayerId || p.packages) {
    const topUp: DirectTopUpProduct = {
      ...base,
      kind: "direct_topup",
      game: {
        id: p.brandId,
        name: p.title,
        platform: p.platform,
      },
      packages: (p.packages ?? []).map((pk) => ({
        id: pk.id,
        label: pk.label,
        amount: pk.amount,
        price: pk.price,
        inStock: true,
      })),
      requiredFields: topUpFieldsFor(p),
      validation: {
        accountLookup: p.requiresPlayerId ? "supported" : "unsupported",
        confirmationRequired: true,
      },
      fulfillmentMode: "automatic",
      fulfillmentEstimateMinutes: p.instant ? 1 : 15,
    };
    return topUp;
  }
  const giftCard: GiftCardProduct = {
    ...base,
    kind: "gift_card",
    redemptionCurrency: p.currency,
    denominations: (p.denominations ?? [p.price]).map((v) => ({
      id: `${p.id}-${v}`,
      faceValue: v,
      price: v,
      inStock: true,
    })),
    pinDelivery: {
      method: "screen",
      instant: p.instant,
    },
    redemptionInstructions: p.redeem,
    restrictions: p.restrictions,
  };
  return giftCard;
}

export const products: Product[] = productSeeds.map(toProduct);

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Compatibility function for callers that previously requested the adapted catalog. */
export function adaptLegacyCatalog(): Product[] {
  return products;
}
