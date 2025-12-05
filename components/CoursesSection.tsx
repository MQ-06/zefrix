'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { courses } from '@/lib/data';
import CourseCard from './CourseCard';

export default function CoursesSection() {
  const featuredCourses = courses.slice(0, 6);

  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Browse our courses
          </h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/courses"
              className="bg-gradient-to-r from-primary to-secondary px-8 py-4 rounded-lg text-white font-semibold text-lg hover:opacity-90 transition-opacity duration-200 shadow-lg"
            >
              View all courses
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}

