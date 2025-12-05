'use client';

import Link from 'next/link';
import { BookOpen, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface CourseCardProps {
  course: {
    id: string;
    slug: string;
    title: string;
    instructor: string;
    instructorImage: string;
    image: string;
    price: number;
    originalPrice: number;
    sections: number;
    duration: number;
    students: number;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  // Determine card color based on course
  const getCardColor = (slug: string) => {
    if (slug.includes('graphic-design')) return 'bg-green-100';
    if (slug.includes('sketch')) return 'bg-gradient-to-br from-orange-300 to-yellow-300';
    if (slug.includes('python')) return 'bg-gradient-to-br from-pink-300 to-orange-300';
    if (slug.includes('bootstrap')) return 'bg-purple-200';
    if (slug.includes('figma')) return 'bg-blue-200';
    if (slug.includes('cms')) return 'bg-pink-200';
    return 'bg-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <Link
        href={`/product/${course.slug}`}
        className="group block bg-dark-light rounded-2xl overflow-hidden transition-all duration-300"
      >
        {/* Colored Header Section */}
        <div className={`relative h-56 ${getCardColor(course.slug)} overflow-hidden`}>
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
          
          {/* Instructor Badge - Top Right */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
            <img
              src={course.instructorImage}
              alt={course.instructor}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <span className="text-sm font-semibold text-gray-800">
              {course.instructor}
            </span>
          </div>
        </div>

        {/* Course Info Section */}
        <div className="p-6 bg-dark-light">
          <h3 className="text-white font-bold text-xl mb-5 line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3rem]">
            {course.title}
          </h3>

          <div className="flex items-center gap-6 text-gray-400 mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-base">{course.sections} Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-base">{course.duration} Days</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-base">{course.students} Students</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-gray-700">
            <div>
              <h4 className="text-yellow-400 font-bold text-2xl mb-1">
                $ {course.price.toFixed(2)} USD
              </h4>
              <div className="text-gray-500 text-base line-through">
                $ {course.originalPrice.toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
