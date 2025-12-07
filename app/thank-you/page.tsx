'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ThankYouPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [paymentId, setPaymentId] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const pid = searchParams.get('payment_id');
        const st = searchParams.get('status');

        if (pid) setPaymentId(pid);
        if (st) setStatus(st);
    }, [searchParams]);

    const isSuccess = status === 'success';

    return (
        <div className="min-h-screen pt-32 pb-16 bg-gradient-to-b from-[#1A1A2E] to-[#0F3460] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl w-full"
            >
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10 text-center">
                    {isSuccess ? (
                        <>
                            {/* Success Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>

                            {/* Success Message */}
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Payment Successful! 🎉
                            </h1>
                            <p className="text-xl text-gray-300 mb-6">
                                Thank you for enrolling in the class!
                            </p>

                            {/* Payment Details */}
                            <div className="bg-white/5 rounded-lg p-6 mb-8 text-left">
                                <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
                                <div className="space-y-2 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Payment ID:</span>
                                        <span className="font-mono text-green-400">{paymentId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Status:</span>
                                        <span className="text-green-400 font-semibold">Completed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Next Steps */}
                            <div className="bg-gradient-to-r from-[#D92A63]/20 to-[#FF654B]/20 rounded-lg p-6 mb-8 text-left border border-[#D92A63]/30">
                                <h3 className="text-lg font-semibold text-white mb-3">📧 What's Next?</h3>
                                <ul className="space-y-2 text-gray-300 text-sm">
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>A confirmation email has been sent to your inbox</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>You'll receive class details and meeting links shortly</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Check your student dashboard for enrolled classes</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/student-dashboard"
                                    className="bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-8 py-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-block"
                                >
                                    Go to Dashboard
                                </Link>
                                <Link
                                    href="/courses"
                                    className="border-2 border-white/20 px-8 py-4 rounded-lg text-white font-medium hover:bg-white/5 transition-colors inline-block"
                                >
                                    Browse More Classes
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Error Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.div>

                            {/* Error Message */}
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Enrollment Issue
                            </h1>
                            <p className="text-xl text-gray-300 mb-6">
                                Your payment was successful, but there was an issue creating your enrollment.
                            </p>

                            {/* Payment Details */}
                            <div className="bg-white/5 rounded-lg p-6 mb-8 text-left">
                                <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
                                <div className="space-y-2 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Payment ID:</span>
                                        <span className="font-mono text-yellow-400">{paymentId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Status:</span>
                                        <span className="text-yellow-400 font-semibold">Needs Attention</span>
                                    </div>
                                </div>
                            </div>

                            {/* Support Message */}
                            <div className="bg-red-500/10 rounded-lg p-6 mb-8 text-left border border-red-500/30">
                                <h3 className="text-lg font-semibold text-white mb-3">🆘 Need Help?</h3>
                                <p className="text-gray-300 text-sm mb-3">
                                    Don't worry! Your payment was successful. Please contact our support team with your payment ID, and we'll manually enroll you in the class.
                                </p>
                                <p className="text-gray-300 text-sm">
                                    Email: <a href="mailto:support@zefrix.com" className="text-[#FFD700] underline">support@zefrix.com</a>
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/contact-us"
                                    className="bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-8 py-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-block"
                                >
                                    Contact Support
                                </Link>
                                <Link
                                    href="/student-dashboard"
                                    className="border-2 border-white/20 px-8 py-4 rounded-lg text-white font-medium hover:bg-white/5 transition-colors inline-block"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
