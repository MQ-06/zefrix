'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Watch our demo video
          </h2>
          <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            See how Zefrix makes live learning simple and engaging. Watch creators host interactive sessions, students join seamlessly, and discover why thousands choose Zefrix for skill-sharing.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-dark-light">
            <img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b899_video-image.jpg"
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            
            {!isPlaying && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(true)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary flex items-center justify-center hover:bg-primary-dark transition-colors duration-200 shadow-2xl"
                aria-label="Play video"
              >
                <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
              </motion.button>
            )}

            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/6cc6M36Mzfg?autoplay=1"
                  title="Demo video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

