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
  // General Questions
  {
    question: "What is HealthScan?",
    answer:
      "HealthScan is an AI-powered mobile app that instantly analyzes food products, meals, and ingredients to provide comprehensive nutritional information, detect harmful substances, and offer personalized health recommendations. Simply take a photo or scan a barcode to discover what's really in your food.",
    category: "general",
  },
  {
    question: "How does HealthScan work?",
    answer:
      "HealthScan uses advanced AI and computer vision to analyze photos of meals, product labels, and barcodes. Our technology identifies ingredients, calculates nutritional content, detects potential toxins or allergens, and provides personalized insights based on your health profile and dietary goals.",
    category: "general",
  },
  {
    question: "When will HealthScan be available?",
    answer:
      "HealthScan is launching soon! Join our waitlist to get early access and receive free weeks when the app launches. We're currently accepting beta testers and will be rolling out access gradually to ensure the best user experience.",
    category: "launch",
  },
  {
    question: "How much will HealthScan cost?",
    answer:
      "We'll offer both free and premium tiers. The free version includes basic scanning and nutritional information. Premium features like detailed toxin analysis, personalized recommendations, and advanced tracking will be available through subscription. Waitlist members get their first weeks free!",
    category: "general",
  },

  // Features
  {
    question: "What kind of foods can HealthScan analyze?",
    answer:
      "HealthScan can analyze virtually any food item - from packaged products with barcodes to fresh meals, fruits, vegetables, restaurant dishes, and homemade recipes. Our AI recognizes ingredients in photos and provides comprehensive analysis for both processed and whole foods.",
    category: "features",
  },
  {
    question:
      "Can HealthScan detect allergens and harmful substances?",
    answer:
      "Yes! HealthScan identifies common allergens (nuts, dairy, gluten, etc.) and detects harmful substances like pesticides, heavy metals, endocrine disruptors, and food additives. We provide safety warnings and help you make informed choices about what you consume.",
    category: "features",
  },
  {
    question:
      "Does HealthScan provide personalized recommendations?",
    answer:
      "Absolutely! HealthScan learns your dietary preferences, health goals, allergies, and nutritional needs to provide personalized recommendations. The app suggests healthier alternatives, tracks your nutrient intake over time, and helps optimize your diet for your specific health objectives.",
    category: "features",
  },
  {
    question: "Can I track my nutrition over time?",
    answer:
      "Yes! HealthScan includes comprehensive tracking features that monitor your nutritional intake, identify patterns, and track progress toward your health goals. You'll see detailed analytics on nutrient consumption, potential deficiencies, and improvements over time.",
    category: "features",
  },
  {
    question: "Does HealthScan work offline?",
    answer:
      "Basic scanning functionality works offline, but detailed analysis, database lookups, and personalized recommendations require an internet connection. We cache frequently scanned items to improve performance when connectivity is limited.",
    category: "technical",
  },

  // Privacy & Data
  {
    question: "How is my data protected?",
    answer:
      "Your privacy is our top priority. All personal health data is encrypted and stored securely. We never sell your data to third parties. Food photos are processed and then deleted from our servers. You have full control over your data and can delete your account at any time.",
    category: "privacy",
  },
  {
    question: "Do you share my food data with companies?",
    answer:
      "Never. We do not share individual user data with food companies, advertisers, or any third parties. We may use anonymized, aggregated data to improve our algorithms and contribute to food safety research, but your personal information remains completely private.",
    category: "privacy",
  },
  {
    question: "Can I export my health data?",
    answer:
      "Yes! You can export all your health and nutrition data at any time in standard formats (CSV, JSON). This ensures you always have access to your information and can share it with healthcare providers if needed.",
    category: "privacy",
  },

  // Technical
  {
    question: "Which devices support HealthScan?",
    answer:
      "HealthScan will be available for both iOS and Android devices. We recommend devices with cameras from the last 5 years for optimal scanning performance. The app works on smartphones and tablets.",
    category: "technical",
  },
  {
    question: "How accurate is the nutritional analysis?",
    answer:
      "HealthScan uses advanced AI technology to analyze nutritional content from food images and product data. While our AI provides comprehensive analysis based on extensive databases like USDA, FDA, and OpenFood Facts, we're continuously working to improve accuracy. We're developing future features that will include expert validation systems and crowd-sourcing assistance to help verify and enhance our data quality over time.",
    category: "technical",
  },
  {
    question: "What if HealthScan can't recognize a food item?",
    answer:
      "If our AI can't identify something, you can manually add ingredients or search our extensive database. You can also submit photos to help us improve - our team reviews submissions to enhance recognition capabilities for future users.",
    category: "technical",
  },

  // Launch & Access
  {
    question: "How do I get early access?",
    answer:
      "Join our waitlist by entering your email address! Early access members will receive invitations as soon as we begin our beta rollout, plus free weeks of premium features. We're also running a referral program - share your link to move up the list faster.",
    category: "launch",
  },
  {
    question: "Will there be a waiting period after launch?",
    answer:
      "We're launching gradually to ensure the best user experience. Waitlist members get priority access, and we'll send invitations in waves. The more people you refer, the earlier you'll get access!",
    category: "launch",
  },
  {
    question: "Can I use HealthScan for my family?",
    answer:
      "Yes! Premium accounts support multiple family member profiles with individual health goals, dietary restrictions, and personalized recommendations. Parents can manage children's profiles and monitor family nutrition trends.",
    category: "features",
  },
];

export const categories = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "general", label: "General", icon: Sparkles },
  { id: "features", label: "Features", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Sparkles },
  { id: "technical", label: "Technical", icon: Sparkles },
  { id: "launch", label: "Launch", icon: Sparkles },
];