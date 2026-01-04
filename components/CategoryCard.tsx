'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Music,
  Palette,
  Video,
  Mic,
  Heart,
  Code,
  Paintbrush,
  ChefHat,
  Shirt,
  Briefcase,
  Languages,
  Gamepad2,
  Camera,
  Theater
} from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    title: string;
    subcategories: string[];
  };
  index: number;
}

// Mapping category slugs to their appropriate Lucide icons
const categoryIcons: { [key: string]: React.ComponentType<any> } = {
  'dance-performing-arts': Theater,
  'music-singing': Music,
  'design-creativity': Palette,
  'content-creator-skills': Video,
  'communication-confidence': Mic,
  'wellness-lifestyle': Heart,
  'tech-digital-skills': Code,
  'art-craft-diy': Paintbrush,
  'cooking-culinary-arts': ChefHat,
  'fashion-styling-beauty': Shirt,
  'business-career-freelancing': Briefcase,
  'language-culture': Languages,
  'gaming-esports': Gamepad2,
  'video-photography-filmmaking': Camera,
};

export default function CategoryCard({ category, index }: CategoryCardProps) {
  const IconComponent = categoryIcons[category.slug] || Palette;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <Link
        href={`/category/${category.slug}`}
        className="group block bg-[#2D2D44] rounded-xl p-5 hover:bg-[#1A1A2E] transition-all duration-300 h-full flex flex-col"
        style={{ minHeight: '280px' }}
      >
        {/* Icon - Pink circle with category icon */}
        <div className="mb-4 flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-[#D92A63] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h4 className="text-white font-bold text-base mb-4 group-hover:text-[#FF6B9D] transition-colors duration-300 flex-shrink-0">
          {category.title}
        </h4>

        {/* Subcategories List */}
        <div className="space-y-2 flex-1">
          {category.subcategories.map((subcategory, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed"
            >
              <span className="text-[#FF6B9D] mt-1 font-bold flex-shrink-0">•</span>
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

