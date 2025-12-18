'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { faqs } from '@/lib/data';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-spacing bg-gradient-to-b from-gray-50 via-pink-50/30 to-purple-50/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions? We've Got{' '}
            <span className="bg-gradient-to-r from-[#FF6B9D] to-[#E91E63] bg-clip-text text-transparent">
              Answers.
            </span>
          </h2>
          <p className="text-gray-600 text-xl">
            Find answers about classes, batches, payments, and how to get started on Zefrix.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="overflow-hidden"
            >
              {/* Question Header - Light Background with Product Colors */}
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full px-8 py-6 flex items-center justify-between text-left transition-all duration-300 ${
                  openIndex === index
                    ? 'bg-gradient-to-r from-pink-100 to-purple-100 rounded-t-xl shadow-md'
                    : 'bg-white rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 shadow-sm'
                }`}
              >
                <h3 className={`font-bold text-xl md:text-2xl pr-4 ${
                  openIndex === index 
                    ? 'text-gray-900' 
                    : 'text-gray-800'
                }`}>
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <X className="w-7 h-7 text-[#FF6B9D]" />
                  ) : (
                    <Plus className="w-7 h-7 text-[#E91E63]" />
                  )}
                </div>
              </button>

              {/* Answer Section - Light Background with Product Color Gradient */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 py-6 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 rounded-b-xl border-t border-pink-200/50">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
