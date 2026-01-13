'use client';

import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { DEFAULT_COURSE_IMAGE, getAvatarUrl } from '@/lib/constants';

interface Course {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  instructorImage: string;
  image: string;
  price: number;
  originalPrice: number;
  comparePrice?: number;
  sections: number;
  duration: number;
  students: number;
}

interface CoursesPageCardProps {
  course: Course;
}

export default function CoursesPageCard({ course }: CoursesPageCardProps) {
  const [imageError, setImageError] = useState(false);
  const [instructorImageError, setInstructorImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(course.image || DEFAULT_COURSE_IMAGE);
  const [instructorImageSrc, setInstructorImageSrc] = useState(course.instructorImage || getAvatarUrl(course.instructor, 128));

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(DEFAULT_COURSE_IMAGE);
    }
  };

  const handleInstructorImageError = () => {
    if (!instructorImageError) {
      setInstructorImageError(true);
      setInstructorImageSrc(getAvatarUrl(course.instructor, 128));
    }
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
        className="group block bg-dark-light rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col"
      >
        {/* Course Image */}
        <div className="relative h-56 overflow-hidden flex-shrink-0">
          <img
            src={imageSrc}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
          />
          
          {/* Instructor Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
            <img
              src={instructorImageSrc}
              alt={course.instructor}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
              onError={handleInstructorImageError}
            />
            <span className="text-sm font-semibold text-gray-800">
              {course.instructor}
            </span>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-6 flex flex-col flex-grow">
          <h2 className="text-white font-bold text-xl mb-5 line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3.5rem]">
            {course.title}
          </h2>

          <div className="flex items-center gap-4 md:gap-6 text-gray-400 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <span className="text-base">
                <span className="font-bold text-white text-lg">{course.sections}</span>{' '}
                <span className="text-gray-400">{course.sections === 1 ? 'Session' : 'Sessions'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-base">
                <span className="font-bold text-white text-lg">{course.duration}</span>{' '}
                <span className="text-gray-400">Days</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-gray-700 mt-auto">
            <div>
              <h3 className="text-yellow-400 font-bold text-2xl mb-1">
                ₹{course.price.toFixed(2)}
              </h3>
              {course.comparePrice && course.comparePrice > course.price && (
                <div className="text-gray-500 text-base line-through">
                  ₹{course.comparePrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

