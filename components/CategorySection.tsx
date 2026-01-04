'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { categories } from '@/lib/data';

export default function CategorySection() {
  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Explore Live Batches
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: 'easeOut'
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <Link
                href={`/category/${category.slug}`}
                className="block p-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl h-full flex flex-col"
                style={{ backgroundColor: category.backgroundColor, minHeight: '200px' }}
              >
                <div className="flex flex-col items-center text-center justify-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-6 shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="w-10 h-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<span class="text-3xl">📚</span>';
                          }
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-gray-800 font-bold text-lg md:text-xl">
                    {category.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
