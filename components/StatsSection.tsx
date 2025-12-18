'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';

export default function StatsSection() {
  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="bg-gradient-to-r from-dark-light to-dark rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
                Trusted by the 20,000+ happy students and online users since 2024
              </h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/contact-us"
                  className="inline-block bg-primary px-10 py-5 rounded-lg text-white font-semibold text-lg hover:opacity-90 transition-opacity duration-200 shadow-lg"
                >
                  Join our community
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-6"
            >
              <div>
                <h2 className="text-6xl md:text-7xl font-bold text-white mb-3 border-b-2 border-primary pb-3 inline-block">
                  10K
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <p className="text-gray-400 text-lg">world wide students love us</p>
              </div>

              <div>
                <h2 className="text-6xl md:text-7xl font-bold text-white mb-3 border-b-2 border-primary pb-3 inline-block">
                  4.7
                </h2>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < 4
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-400 text-lg">1456 user review by Google</p>
              </div>
            </motion.div>
          </div>

          {/* Testimonial Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-start gap-4">
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b748_avatar-2.jpg"
                alt="Student"
                className="w-12 h-12 rounded-full"
              />
              <p className="text-white text-xl md:text-2xl italic leading-relaxed">
                "Zefrix makes learning fun and interactive. The live sessions with creators have helped me learn new skills I never thought I could master."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

