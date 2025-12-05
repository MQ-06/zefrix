'use client';

import { motion } from 'framer-motion';
import { Search, DollarSign, Monitor } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Browse our courses',
    description:
      'Annoying consequences, or one who avoids a pain that produces no resultant pleasure',
    bgColor: 'bg-purple-200',
    borderColor: 'border-yellow-400',
  },
  {
    icon: DollarSign,
    title: 'Purchase quickly and securely',
    description:
      'Insipidity the sufficient discretion imprudence resolution sir him decisively.',
    bgColor: 'bg-green-200',
    borderColor: 'border-pink-400',
  },
  {
    icon: Monitor,
    title: 'Start learning right away',
    description:
      'Affronting imprudence do he he everything. Sex lasted dinner wanted indeed wished.',
    bgColor: 'bg-yellow-200',
    borderColor: 'border-pink-400',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="section-spacing">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
          >
            <img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b785_about-1.jpg"
              alt="How it works"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
              How it works in 3 simple steps
            </h2>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, x: 30 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.15,
                    ease: 'easeOut'
                  }}
                  whileHover={{ 
                    x: 8,
                    transition: { duration: 0.3 }
                  }}
                  className={`relative ${step.bgColor} rounded-xl p-6 border-l-4 border-b-4 ${step.borderColor} shadow-lg`}
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md">
                      <step.icon className="w-7 h-7 text-gray-800" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-bold text-xl md:text-2xl mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
