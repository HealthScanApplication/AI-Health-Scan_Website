import React from 'react';
import { HelpCircle } from 'lucide-react';

export function FAQContactCTA() {
  return (
    <div className="text-center mt-16 p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Still have questions?
      </h3>
      <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
        Can't find what you're looking for? Our team is here to help! 
        Reach out and we'll get back to you as soon as possible.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a
          href="mailto:hello@healthscan.live"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-80 h-12 px-6 bg-[var(--healthscan-green)] hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Contact Support
        </a>
        <a
          href="https://discord.gg/4QJpFyTD44"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-80 h-12 px-6 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-200 transition-colors"
        >
          Join Our Community
        </a>
      </div>
    </div>
  );
}