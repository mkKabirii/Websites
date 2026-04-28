const AutoReply = require("../model/autoReplyModel");

const DEFAULT_WEBSITE_AUTO_REPLIES = [
  {
    title: "Website Welcome Assistant",
    category: "greeting",
    triggerKeywords: [
      "hi",
      "hello",
      "hey",
      "help",
      "start",
      "support",
      "website",
    ],
    message:
      "Welcome to WG-TECH. I can help you from first inquiry all the way to project kickoff inside your portal.\n\n" +
      "If you are a new client, this is the exact flow:\n" +
      "1) Go to Contact Us and submit your details (name, email, service need, budget range, and project brief).\n" +
      "2) Our team reviews your request and sends portal credentials to your email after approval.\n" +
      "3) Use those credentials on the login page to enter your client portal.\n" +
      "4) Inside the portal, discuss scope, timeline, files, and milestones with our support/project team.\n\n" +
      "You can ask me now about:\n" +
      "- How to login\n" +
      "- How to assign a project\n" +
      "- Full service categories and recommendations\n" +
      "- What happens after you submit Contact Us",
    responseDelay: 1,
  },
  {
    title: "How To Login",
    category: "faq",
    triggerKeywords: [
      "login",
      "log in",
      "sign in",
      "portal",
      "account",
      "password",
      "credentials",
      "contact us",
      "how can i login",
      "how to login",
    ],
    message:
      "Great question. Here is the full login process for new clients:\n\n" +
      "Step 1 - Submit Contact Us form:\n" +
      "Open Contact Us and fill complete details: your name, active email, phone/WhatsApp, required service, estimated budget, and project idea.\n\n" +
      "Step 2 - Account review and approval:\n" +
      "Our team validates your request and creates your client access.\n\n" +
      "Step 3 - Credentials sent by email:\n" +
      "You receive your login credentials on your registered email. Please also check spam/junk folder.\n\n" +
      "Step 4 - Portal login:\n" +
      "Use the same email and password on the client portal login page.\n\n" +
      "Step 5 - Start project discussion in portal:\n" +
      "After login, you can discuss requirements, share references/files, review quotation, and track project communication directly in your portal chat.\n\n" +
      "If you already submitted Contact Us but did not get credentials, send your registered email here and we will assist quickly.",
    responseDelay: 1,
  },
  {
    title: "Project Assignment Guide",
    category: "support",
    triggerKeywords: [
      "assign",
      "project",
      "hire",
      "team",
      "start project",
      "quotation",
      "proposal",
      "budget",
    ],
    message:
      "To assign your project smoothly, please share these details:\n" +
      "- Project type (marketing, website, app, design, automation, etc.)\n" +
      "- Business goal and expected outcome\n" +
      "- Must-have features/services\n" +
      "- Budget range\n" +
      "- Preferred timeline/deadline\n" +
      "- Any references, examples, or files\n\n" +
      "What happens next:\n" +
      "1) We review your requirements.\n" +
      "2) We prepare the best-fit plan/quotation.\n" +
      "3) Team is assigned based on your domain and timeline.\n" +
      "4) You continue updates and discussion in your client portal.",
    responseDelay: 1,
  },
  {
    title: "Services We Provide",
    category: "support",
    triggerKeywords: [
      "services",
      "service",
      "seo",
      "marketing",
      "ads",
      "development",
      "website development",
      "app",
      "design",
      "video",
      "automation",
      "crm",
      "erp",
      "ai",
      "blockchain",
      "nft",
      "game",
    ],
    message:
      "WG-TECH core services:\n\n" +
      "Marketing & Digital Growth:\n" +
      "SEO, social media marketing, PPC, Google/Facebook/Instagram/TikTok ads, content marketing, brand identity/strategy/positioning, viral content, influencer marketing, motion/video campaigns, B2B lead generation, email marketing, marketing automation.\n\n" +
      "Development:\n" +
      "Custom web development, frontend (React/Vue/Next.js), backend (Node/Laravel/Django), full-stack, ecommerce (Shopify/WooCommerce/OpenCart), CMS (WordPress/Drupal/Joomla), web apps (PWA/SaaS), API integration, landing pages, redesigns.\n\n" +
      "Apps, Software, and Systems:\n" +
      "Android, iOS, Flutter/React Native, cross-platform, enterprise, on-demand apps, desktop apps, POS, ERP, CRM, HR/payroll, inventory systems.\n\n" +
      "Design, Video, and Business Solutions:\n" +
      "Logo/branding, UI/UX, wireframes, motion graphics, animation, video editing, reels, YouTube/corporate/product videos, color grading, VFX, sound/podcast editing, Agile project handling, IT consultancy, cloud migration, DevOps, maintenance, service desk, QA.\n\n" +
      "Also available: game development, AI apps/chatbots/ML integrations, blockchain, smart contracts, NFT marketplaces.",
    responseDelay: 1,
  },
];

const ensureDefaultWebsiteAutoReplies = async (adminId) => {
  if (!adminId) return;

  const existingReplies = await AutoReply.find({ adminId }).lean();
  const existingByTitle = new Map(existingReplies.map((reply) => [reply.title, reply]));

  const isLegacyShortTemplate = (title, message) => {
    if (!message || typeof message !== "string") return false;

    if (title === "Website Welcome Assistant") {
      return message.includes("Quick steps:") && message.includes("Login: Use the portal login");
    }

    if (title === "How To Login") {
      return message.includes("To access your portal:") && message.includes("Open the client login page");
    }

    if (title === "Project Assignment Guide") {
      return message.includes("To assign a project, send these details in chat:");
    }

    return false;
  };

  for (const item of DEFAULT_WEBSITE_AUTO_REPLIES) {
    const existing = existingByTitle.get(item.title);

    if (!existing) {
      await AutoReply.create({
        adminId,
        title: item.title,
        message: item.message,
        category: item.category,
        triggerKeywords: item.triggerKeywords,
        responseDelay: item.responseDelay || 0,
        maxUsesPerDay: null,
        isActive: true,
      });
      continue;
    }

    // Upgrade only legacy short defaults; preserve admin customizations.
    if (isLegacyShortTemplate(item.title, existing.message)) {
      await AutoReply.findByIdAndUpdate(existing._id, {
        message: item.message,
        triggerKeywords: item.triggerKeywords,
        responseDelay: item.responseDelay || 0,
      });
    }
  }
};

module.exports = {
  DEFAULT_WEBSITE_AUTO_REPLIES,
  ensureDefaultWebsiteAutoReplies,
};
