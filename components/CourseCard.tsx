'use client';

import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { DEFAULT_COURSE_IMAGE, getAvatarUrl } from '@/lib/constants';

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
  const [imageError, setImageError] = useState(false);
  const [instructorImageError, setInstructorImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(course.image || DEFAULT_COURSE_IMAGE);
  const [instructorImageSrc, setInstructorImageSrc] = useState(course.instructorImage || getAvatarUrl(course.instructor, 128));

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!imageError) {
      const img = e.target as HTMLImageElement;
      console.error('❌ [CourseCard] Image failed to load:', {
        classId: course.id,
        attemptedUrl: img.src,
        title: course.title,
      });
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
        className="group block bg-dark-light rounded-2xl overflow-hidden transition-all duration-300"
      >
        {/* Colored Header Section */}
        <div className={`relative h-56 ${getCardColor(course.slug)} overflow-hidden`}>
          <img
            src={imageSrc}
            alt={course.title}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            onError={handleImageError}
            onLoad={() => {
              console.log('✅ [CourseCard] Image loaded successfully:', {
                classId: course.id,
                url: imageSrc,
                title: course.title,
              });
            }}
          />
          
          {/* Discount Badge - Top Left */}
          {course.originalPrice > course.price && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg font-bold text-sm">
              {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
            </div>
          )}
          
          {/* Instructor Badge - Bottom Right */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
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

        {/* Course Info Section */}
        <div className="p-6 bg-dark-light">
          <h3 className="text-white font-bold text-xl mb-5 line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3rem]">
            {course.title}
          </h3>

          <div className="flex items-center gap-6 text-gray-400 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-base">
                <span className="font-bold text-white text-xl">{course.sections}</span>{' '}
                <span className="text-gray-400">Sessions</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <span className="text-base">
                <span className="font-bold text-white text-xl">{course.duration}</span>{' '}
                <span className="text-gray-400">Days</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-gray-700 mb-4">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <h4 className="text-yellow-400 font-bold text-3xl">
                  ₹{course.price.toFixed(2)}
                </h4>
                <div className="text-gray-500 text-lg line-through">
                  ₹{course.originalPrice.toFixed(2)}
                </div>
              </div>
              <p className="text-green-400 text-sm font-semibold">Save ₹{(course.originalPrice - course.price).toFixed(2)}</p>
            </div>
          </div>

          {/* Strong CTA Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/product/${course.slug}`;
            }}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-6 rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Reserve Your Seat Now →
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
