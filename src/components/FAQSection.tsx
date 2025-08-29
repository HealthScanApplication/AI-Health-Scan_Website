import React, { useState } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { faqData, categories } from '../constants/faqData';
import { FAQItem } from './FAQItem';
import { FAQContactCTA } from './FAQContactCTA';

export function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-green-50"></div>
        
        {/* Floating blobs */}
        <div className="absolute w-96 h-96 rounded-full opacity-10 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.2) 50%, transparent 70%)`,
               top: "10%",
               right: "5%",
               filter: "blur(40px)",
             }}></div>
        
        <div className="absolute w-80 h-80 rounded-full opacity-8 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.15) 50%, transparent 70%)`,
               bottom: "15%",
               left: "5%",
               filter: "blur(35px)",
             }}></div>
        
        <div className="absolute w-64 h-64 rounded-full opacity-12 animate-blob-float-5"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.25) 0%, transparent 70%)`,
               top: "60%",
               right: "20%",
               filter: "blur(30px)",
             }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked
            <span className="text-[var(--healthscan-green)]"> Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about HealthScan, from features and privacy 
            to launch details and technical requirements.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[var(--healthscan-green)] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredFAQs.map((faq, index) => (
              <FAQItem
                key={`${selectedCategory}-${index}`}
                faq={faq}
                index={index}
                isOpen={openItems.has(index)}
                onToggle={toggleItem}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Contact CTA */}
        <FAQContactCTA />
      </div>
    </section>
  );
}