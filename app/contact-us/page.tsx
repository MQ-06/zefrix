'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    addDoc: any;
    serverTimestamp: any;
  }
}

export default function ContactUsPage() {
  const { showError, showSuccess, showInfo } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load Firebase if not already loaded
    if (typeof window !== 'undefined' && !window.firebaseDb) {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
        
        const firebaseConfig = {
          apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
          authDomain: "zefrix-custom.firebaseapp.com",
          projectId: "zefrix-custom",
          storageBucket: "zefrix-custom.firebasestorage.app",
          messagingSenderId: "50732408558",
          appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
          measurementId: "G-27HS1SWB5X"
        };
        
        const app = initializeApp(firebaseConfig);
        window.firebaseDb = getFirestore(app);
        window.collection = collection;
        window.addDoc = addDoc;
        window.serverTimestamp = serverTimestamp;
      `;
      document.head.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.firebaseDb || !window.collection || !window.addDoc) {
      showInfo('Please wait a moment and try again...');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Save to Firestore
      const contactsRef = window.collection(window.firebaseDb, 'contacts');
      await window.addDoc(contactsRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        subject: formData.subject,
        message: formData.message,
        status: 'new',
        createdAt: window.serverTimestamp(),
        read: false
      });

      setSubmitMessage({
        type: 'success',
        text: 'Thank you! Your message has been sent successfully. We\'ll get back to you soon!'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Sorry, there was an error sending your message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero-inner pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>

        <div className="container relative z-10">
          <div className="text-center position-relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 relative"
            >
              <span className="relative">
                We're here to help!
                <motion.img
                  src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7d8_element-7.svg"
                  loading="lazy"
                  alt=""
                  className="element-image-seventeen absolute top-0 left-0 w-full h-full opacity-100 -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="paragraph-8 text-gray-400 text-sm md:text-base max-w-2xl mx-auto"
            >
              Earth Creepeth Fish earth great saying also itself.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-section section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="contact-form-wrap bg-glass bg-[#F5F5DC]/95 backdrop-blur-md rounded-2xl p-6 md:p-8 lg:p-10"
            >
              <div className="form-block">
                <h2 className="section-title heading-h3 text-[#1A1A2E] font-bold text-2xl md:text-3xl mb-6">
                  Let's chat
                </h2>
                <form
                  id="wf-form-Contact-Form"
                  name="wf-form-Contact-Form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="div-block grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="form-input w-input bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1A1A2E] placeholder-gray-500 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                      maxLength={256}
                      name="name"
                      placeholder="Your Name"
                      type="text"
                      id="Name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <input
                      className="form-input w-input bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1A1A2E] placeholder-gray-500 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                      maxLength={256}
                      name="email"
                      placeholder="Your Email"
                      type="email"
                      id="Email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <input
                      className="form-input w-input bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1A1A2E] placeholder-gray-500 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                      maxLength={256}
                      name="phone"
                      placeholder="Your Phone no."
                      type="tel"
                      id="Your-Phone-no"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <input
                      className="form-input w-input bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1A1A2E] placeholder-gray-500 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                      maxLength={256}
                      name="subject"
                      placeholder="Your Subject"
                      type="text"
                      id="Your-Subject"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                    <textarea
                      id="Your-Message"
                      name="message"
                      maxLength={5000}
                      placeholder="Your Message"
                      className="form-input form-textarea w-input bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1A1A2E] placeholder-gray-500 focus:outline-none focus:border-[#FF6B9D] transition-colors resize-none md:col-span-2"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  {submitMessage && (
                    <div
                      className={`p-4 rounded-lg ${submitMessage.type === 'success'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                    >
                      {submitMessage.text}
                    </div>
                  )}

                  <input
                    type="submit"
                    disabled={isSubmitting}
                    data-wait="Please wait..."
                    className="button-primary-1 button-full w-button w-full bg-gradient-to-r from-[#E91E63] to-[#FF6B9D] text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    value={isSubmitting ? 'Sending...' : 'Send Message'}
                  />
                </form>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block"
            >
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7df_about-4.jpg"
                loading="eager"
                sizes="(max-width: 767px) 100vw, (max-width: 991px) 95vw, 768px"
                srcSet="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7df_about-4-p-500.jpg 500w, https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7df_about-4.jpg 768w"
                alt="About"
                className="about-image w-full h-auto rounded-2xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Address Section */}
      <div className="contact-address-section section-spacing-bottom bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Call us */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="contact-item bg-[#FFE66D] rounded-xl p-6 text-center border-2 border-[#FFE66D]"
            >
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b89b_call.svg"
                loading="eager"
                alt="Call"
                className="contact-address-icon w-12 h-12 mx-auto mb-4"
              />
              <h3 className="heading-h5 contact-info-text text-[#1A1A2E] font-bold text-lg mb-2">
                Call us:
              </h3>
              <a
                href="tel:+015982694756"
                className="text-[#1A1A2E] underline hover:text-[#E91E63] transition-colors"
              >
                +01 598 269 4756
              </a>
            </motion.div>

            {/* Email us */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="contact-item bg-[#FFE66D] rounded-xl p-6 text-center border-2 border-[#FFE66D]"
            >
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b89a_mail.svg"
                loading="eager"
                alt="Mail"
                className="contact-address-icon w-12 h-12 mx-auto mb-4"
              />
              <h3 className="heading-h5 contact-info-text text-[#1A1A2E] font-bold text-lg mb-2">
                Email us:
              </h3>
              <a
                href="mailto:info@example.com"
                className="text-[#1A1A2E] underline hover:text-[#E91E63] transition-colors"
              >
                info@example.com
              </a>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="contact-item bg-[#FFE66D] rounded-xl p-6 text-center border-2 border-[#FFE66D]"
            >
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b86b_location.svg"
                loading="eager"
                alt="Location"
                className="contact-address-icon w-12 h-12 mx-auto mb-4"
              />
              <h3 className="heading-h5 contact-info-text text-[#1A1A2E] font-bold text-lg mb-2">
                Address:
              </h3>
              <div className="text-[#1A1A2E]">
                Chicago HQ Estica Cop. Macomb, MI 48042
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

