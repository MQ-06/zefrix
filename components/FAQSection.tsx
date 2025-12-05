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
    <section className="section-spacing bg-dark-light">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Questions? We've Got{' '}
            <span className="text-primary">Answers.</span>
          </h2>
          <p className="text-gray-400 text-xl">
            We've got answers to help you.
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
              {/* Question Header - Light Background */}
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full px-8 py-6 flex items-center justify-between text-left transition-all duration-300 ${
                  openIndex === index
                    ? 'bg-white/10 rounded-t-xl'
                    : 'bg-white/5 rounded-xl hover:bg-white/10'
                }`}
              >
                <h3 className="text-white font-bold text-xl md:text-2xl pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <X className="w-7 h-7 text-primary" />
                  ) : (
                    <Plus className="w-7 h-7 text-primary" />
                  )}
                </div>
              </button>

              {/* Answer Section - Gradient Background */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 py-6 bg-gradient-to-r from-dark via-purple-900 to-pink-900 rounded-b-xl">
                      <p className="text-white text-lg leading-relaxed">
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
