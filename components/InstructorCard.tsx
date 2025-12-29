'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Instructor } from '@/lib/instructorsData';

interface InstructorCardProps {
  instructor: Instructor;
  index: number;
}

export default function InstructorCard({ instructor, index }: InstructorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <Link
        href={`/creator/${instructor.id}`}
        className="group block text-center instructor-item"
        aria-label={`View ${instructor.name}'s profile`}
      >
        <div className="instructor-image-wrap mb-4 relative">
          <motion.img
            alt={instructor.name}
            loading="eager"
            src={instructor.image}
            className="instructor-image w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto group-hover:scale-105 transition-transform duration-300"
            whileHover={{ scale: 1.05 }}
            onError={(e) => {
              // If image fails to load, fallback to avatar API
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('ui-avatars.com')) {
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=D92A63&color=fff&size=200`;
              }
            }}
          />
        </div>
        <h2 className="heading-h6 no-margin text-white font-bold text-base mb-1 group-hover:text-[#FF6B9D] transition-colors duration-300">
          {instructor.name}
        </h2>
        <div className="text-block-10 text-gray-400 text-xs md:text-sm">
          {instructor.title}
        </div>
      </Link>
    </motion.div>
  );
}

