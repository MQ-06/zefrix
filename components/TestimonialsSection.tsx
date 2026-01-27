'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, BadgeCheck } from 'lucide-react';
import { testimonials } from '@/lib/data';

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="section-spacing relative overflow-hidden">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Real Results from Real Professionals
          </h2>
          <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Verified students from top companies share their success stories after completing live batches on Zefrix.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative bg-dark-light rounded-2xl p-8 md:p-12 min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-gray-300 text-lg md:text-xl mb-8 leading-relaxed">
                  "{testimonials[currentIndex].content}"
                </p>

                {testimonials[currentIndex].courseTaken && (
                  <div className="mb-8 inline-block px-4 py-2 bg-primary/20 border border-primary/30 rounded-full">
                    <p className="text-primary text-sm font-semibold">
                      Completed: {testimonials[currentIndex].courseTaken}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-5">
                  <motion.img
                    src={testimonials[currentIndex].avatar}
                    alt={testimonials[currentIndex].name}
                    className="w-20 h-20 rounded-full border-4 border-primary"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-xl md:text-2xl">
                        {testimonials[currentIndex].name}
                      </h3>
                      {testimonials[currentIndex].verified && (
                        <BadgeCheck className="w-6 h-6 text-blue-400 fill-blue-400" />
                      )}
                    </div>
                    <p className="text-gray-300 text-base font-medium">
                      {testimonials[currentIndex].role}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {testimonials[currentIndex].company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <motion.button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:bg-primary-dark transition-colors duration-200 shadow-lg"
            aria-label="Previous testimonial"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-7 h-7 text-white" />
          </motion.button>

          <motion.button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:bg-primary-dark transition-colors duration-200 shadow-lg"
            aria-label="Next testimonial"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-7 h-7 text-white" />
          </motion.button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

