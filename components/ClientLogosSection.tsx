'use client';

import { motion } from 'framer-motion';

const logos = [
  {
    name: 'Artistry',
    src: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b880_cl-logo-dark-01.svg',
  },
  {
    name: 'Dexign Studio',
    src: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b881_cl-logo-dark-02.svg',
  },
  {
    name: 'Emblem',
    src: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b882_cl-logo-dark-03.svg',
  },
  {
    name: 'Grapherz',
    src: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b883_cl-logo-dark-04.svg',
  },
  {
    name: 'Grapho',
    src: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b884_cl-logo-dark-05.svg',
  },
];

export default function ClientLogosSection() {
  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center justify-center"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

