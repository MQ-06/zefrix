import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Zefrix',
  description: 'Learn how Zefrix protects your data and privacy on our live learning platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-dark py-20">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-400 mb-12">Last updated: January 27, 2026</p>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              At Zefrix, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our live learning platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We collect information that you provide directly to us when you:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Create an account</li>
              <li>Enroll in classes or batches</li>
              <li>Communicate with instructors or other users</li>
              <li>Contact our support team</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, including to process your enrollments, facilitate live classes, and communicate with you about your account and our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our{' '}
              <a href="/contact-us" className="text-primary hover:underline">
                contact page
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

