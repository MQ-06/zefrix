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
  maxSeats?: number;
  startDate?: string;
  enrollmentCount?: number;
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

  // Calculate urgency indicators
  const getUrgencyInfo = () => {
    const seatsLeft = course.maxSeats && course.enrollmentCount !== undefined 
      ? course.maxSeats - course.enrollmentCount 
      : null;
    
    let daysUntilStart = null;
    if (course.startDate) {
      try {
        const startDate = new Date(course.startDate);
        const today = new Date();
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 30) {
          daysUntilStart = diffDays;
        }
      } catch (e) {
        // Invalid date
      }
    }

    // Prioritize: show seats if low (<=15), otherwise show days if soon (<=7)
    if (seatsLeft !== null && seatsLeft > 0 && seatsLeft <= 15) {
      return { type: 'seats', value: seatsLeft, text: `Only ${seatsLeft} Seat${seatsLeft === 1 ? '' : 's'} Left` };
    } else if (daysUntilStart !== null && daysUntilStart <= 7) {
      return { type: 'days', value: daysUntilStart, text: `Batch Starts in ${daysUntilStart} Day${daysUntilStart === 1 ? '' : 's'}` };
    }
    return null;
  };

  const urgencyInfo = getUrgencyInfo();

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
          
          {/* Urgency Badge - Top Left */}
          {urgencyInfo && (
            <div className={`absolute top-4 left-4 ${urgencyInfo.type === 'seats' ? 'bg-red-600' : 'bg-orange-600'} text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-pulse`}>
              🔥 {urgencyInfo.text}
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

        {/* Course Info */}
        <div className="p-6 flex flex-col flex-grow">
          <h2 className="text-white font-bold text-xl mb-5 line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3.5rem]">
            {course.title}
          </h2>

          <div className="flex items-center gap-6 text-gray-400 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-base">
                <span className="font-bold text-white text-xl">{course.sections}</span>{' '}
                <span className="text-gray-400">{course.sections === 1 ? 'Session' : 'Sessions'}</span>
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

          <div className="flex items-center justify-between pt-5 border-t border-gray-700 mt-auto mb-4">
            <div>
              <h3 className="text-yellow-400 font-bold text-3xl">
                ₹{course.price.toFixed(2)}
              </h3>
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

