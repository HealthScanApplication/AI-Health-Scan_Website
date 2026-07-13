import { HelpCircle, Sparkles } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: string;
  category:
    | "general"
    | "features"
    | "privacy"
    | "technical"
    | "launch";
}

export const faqData: FAQItem[] = [
  // General
  {
    question: "What is ROUTINE³?",
    answer:
      "ROUTINE³ is a goal-based health app. Tell it what you want to achieve — lose weight, clearer skin, build muscle, more energy, better sleep, or feed your kids better — and it builds you a personalized routine: daily to-dos, meals, habits, and activity, with an AI food scanner built in to check what you eat along the way.",
    category: "general",
  },
  {
    question: "What exactly is a “routine”?",
    answer:
      "A routine is your day-by-day plan for a goal. It's a simple checklist grouped into supplements, things to consume, things to do, and sleep — each scheduled through the day. You tick items off as you go, build streaks, and watch your progress. ROUTINE³ adapts the routine over time as you stick with it.",
    category: "general",
  },
  {
    question: "How much does ROUTINE³ cost?",
    answer:
      "There's a free tier and a premium subscription. Free covers the core routine, daily checklist, and food scanning. Premium unlocks deeper analysis, activity integrations, family profiles, and the ability to shop your routine in one tap. You can try the app and start a routine before deciding to upgrade.",
    category: "general",
  },

  // Features
  {
    question: "How do I build a routine?",
    answer:
      "Pick a goal and ROUTINE³ generates a routine for it in seconds — the daily to-dos, meals, habits, and the exact foods, supplements, and products you'll need. From there you just follow the plan each day, check items off, and let it adjust as you progress.",
    category: "features",
  },
  {
    question: "What goals can I create a routine for?",
    answer:
      "Health goals like losing weight, more energy, gut health, lowering sugar, and better sleep; beauty goals like clearer skin, glowing complexion, and stronger hair and nails; and fitness goals like building muscle, getting lean, and boosting endurance. There are also routines for women's health and for feeding kids well.",
    category: "features",
  },
  {
    question: "How does the food scanner work?",
    answer:
      "Point your camera at any meal or packaged product. ROUTINE³ reads it in seconds and gives you a health score, the nutrients that matter, and the ingredients worth watching — then tells you whether it fits your current goal and logs it to your routine. The scanner is built into every routine, so what you eat feeds directly into your plan.",
    category: "features",
  },
  {
    question: "Does it track my activity, and sync with Strava and Ōura Ring?",
    answer:
      "Yes. You can log workouts, water, sleep, and habits, and watch your streaks build. ROUTINE³ also syncs with Strava and the Ōura Ring, so your workouts and your sleep and recovery flow in automatically and your routine adapts to how your body is actually doing.",
    category: "features",
  },
  {
    question: "Can I buy everything my routine needs?",
    answer:
      "Yes. Every routine comes with a kit — the specific foods, supplements, and products it calls for — and you can shop the lot in a single tap rather than hunting them down yourself.",
    category: "features",
  },
  {
    question: "Can I use ROUTINE³ for my family?",
    answer:
      "Yes. Premium accounts support multiple profiles with their own goals, preferences, and dietary needs. Parents can manage a child's routine, plan family meals everyone will actually eat, and keep an eye on the household's nutrition together.",
    category: "features",
  },

  // Privacy & Data
  {
    question: "How is my data protected?",
    answer:
      "Your privacy comes first. Personal health data is encrypted and stored securely, food photos are processed and then deleted from our servers, and you have full control — you can delete your account and data at any time.",
    category: "privacy",
  },
  {
    question: "Do you sell or share my data?",
    answer:
      "Never. We don't sell or share your personal data with food companies, advertisers, or any third party. We may use anonymized, aggregated data to improve our analysis, but your personal information stays private — full stop.",
    category: "privacy",
  },
  {
    question: "What happens to my Strava and Ōura data?",
    answer:
      "Connected services like Strava and the Ōura Ring are used only to personalize your routine — bringing in your workouts, sleep, and recovery. We never sell that data, and you can disconnect either service at any time from settings.",
    category: "privacy",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. You can export your health and nutrition data at any time in standard formats (CSV, JSON), so you always have it and can share it with a healthcare provider if you choose.",
    category: "privacy",
  },

  // Technical
  {
    question: "Which devices is ROUTINE³ on?",
    answer:
      "ROUTINE³ is live on iOS — download it from the App Store on iPhone today. An Android version is coming soon. For the best scanning results we recommend a device with a camera from roughly the last five years.",
    category: "technical",
  },
  {
    question: "How accurate is the scanner's analysis?",
    answer:
      "The scanner uses AI and computer vision alongside established databases like USDA, FDA, and Open Food Facts to estimate nutrition and flag ingredients to watch. It's informational and always improving — it isn't a medical device and doesn't diagnose, treat, or cure anything, so check with a qualified professional for medical advice.",
    category: "technical",
  },
  {
    question: "Does it work offline?",
    answer:
      "Your daily checklist and routine work offline, so you can tick items off anywhere. Scanning, detailed analysis, and syncing with services like Strava and Ōura need an internet connection. Frequently scanned items are cached to keep things fast.",
    category: "technical",
  },
  {
    question: "What if the scanner can't recognize a food?",
    answer:
      "If the AI can't identify something, you can add it manually or search the catalog. You can also submit a photo to help us improve — our team reviews submissions so recognition keeps getting better for everyone.",
    category: "technical",
  },

  // Availability & Access
  {
    question: "Is ROUTINE³ available yet?",
    answer:
      "Yes — ROUTINE³ is out now on the App Store for iPhone. There's no waitlist and no invite needed: download it, pick a goal, and start your first routine today. Android is on the way.",
    category: "launch",
  },
  {
    question: "Do I need an invite or to join a waitlist?",
    answer:
      "No. The app is live, so you can get started straight away on iOS. If you'd like occasional updates — new routines, scanner findings, and tips — you can subscribe to the dispatch, but it's not required to use the app.",
    category: "launch",
  },
  {
    question: "How do I get started?",
    answer:
      "Download ROUTINE³ from the App Store, choose the goal that matters to you, and you'll get a personalized routine right away. Follow the daily to-dos, scan your food as you go, and connect Strava or your Ōura Ring to make it even more tailored.",
    category: "launch",
  },
];

export const categories = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "general", label: "General", icon: Sparkles },
  { id: "features", label: "Routines & Features", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Sparkles },
  { id: "technical", label: "Technical", icon: Sparkles },
  { id: "launch", label: "Availability", icon: Sparkles },
];
