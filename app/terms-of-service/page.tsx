import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Zefrix',
  description: 'Read the terms and conditions for using Zefrix live learning platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-dark py-20">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Terms of Service
        </h1>
        <p className="text-gray-400 mb-12">Last updated: January 27, 2026</p>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using Zefrix, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Use License</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Zefrix grants you a limited, non-exclusive, non-transferable license to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Access and use the platform for personal, educational purposes</li>
              <li>Enroll in and attend live classes</li>
              <li>Interact with instructors and other students</li>
              <li>Create content as a creator (subject to approval)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">User Responsibilities</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              As a user of Zefrix, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Respect intellectual property rights</li>
              <li>Conduct yourself professionally in all interactions</li>
              <li>Not use the platform for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Payment Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              All payments for classes and batches are processed securely. Refund policies are determined on a per-class basis and are outlined at the time of enrollment.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              Zefrix shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              Questions about the Terms of Service should be sent to us through our{' '}
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

