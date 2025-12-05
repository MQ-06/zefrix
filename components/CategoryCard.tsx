'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    title: string;
    subcategories: string[];
  };
  index: number;
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <Link
        href={`/category/${category.slug}`}
        className="group block bg-[#2D2D44] rounded-xl p-5 hover:bg-[#1A1A2E] transition-all duration-300"
      >
        {/* Icon - Pink circle with white star */}
        <div className="mb-4">
          <div className="w-14 h-14 rounded-full bg-[#D92A63] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-white font-bold text-base mb-4 group-hover:text-[#FF6B9D] transition-colors duration-300">
          {category.title}
        </h4>

        {/* Subcategories List */}
        <div className="space-y-2">
          {category.subcategories.map((subcategory, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed"
            >
              <span className="text-[#FF6B9D] mt-1 font-bold">•</span>
              <span className="group-hover:text-gray-300 transition-colors duration-300">
                {subcategory}
              </span>
            </div>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

