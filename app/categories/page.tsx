'use client';

import { categoryDetails } from '@/lib/categoriesData';
import CategoryCard from '@/components/CategoryCard';
import FooterCTA from '@/components/FooterCTA';
import { motion } from 'framer-motion';

export default function CategoriesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-inner pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden">
        {/* Background Gradient matching real site */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>
        
        <div className="container relative z-10">
          <div className="text-center position-relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              Explore our Categories
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto"
            >
              Explore interactive live sessions across diverse categories. Learn from skilled creators and connect with a community of passionate learners.
            </motion.p>
            
            {/* Decorative Elements */}
            <motion.img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b765_element-3.svg"
              loading="lazy"
              alt=""
              className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 opacity-30 -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryDetails.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <FooterCTA />
    </>
  );
}
