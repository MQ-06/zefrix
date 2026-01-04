"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

/* =========================
   Inner Client Component
   ========================= */
function ThankYouContent() {
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const pid = searchParams.get("payment_id");
    const st = searchParams.get("status");

    if (pid) setPaymentId(pid);
    if (st) setStatus(st);
  }, [searchParams]);

  const isSuccess = status === "success";
  const isPartialSuccess = status === "partial_success";
  const failedCount = searchParams.get("failed");

  return (
    <div className="min-h-screen pt-32 pb-16 bg-gradient-to-b from-[#1A1A2E] to-[#0F3460] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10 text-center">
          {isSuccess || isPartialSuccess ? (
            <>
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {isPartialSuccess ? "Partial Enrollment Success" : "Payment Successful 🎉"}
              </h1>

              <p className="text-xl text-gray-300 mb-6">
                {isPartialSuccess 
                  ? `Some classes were enrolled successfully. ${failedCount} ${failedCount === "1" ? "class" : "classes"} need manual processing.`
                  : "Thank you for enrolling in the class!"}
              </p>
              
              {isPartialSuccess && (
                <div className="bg-yellow-500/10 rounded-lg p-6 mb-8 border border-yellow-500/30 text-left">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                    ⚠️ Action Required
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Your payment was successful (Payment ID: <span className="font-mono text-yellow-400">{paymentId || "N/A"}</span>), but some enrollments couldn't be completed automatically.
                  </p>
                  <p className="text-gray-300 text-sm">
                    Our team will process the remaining enrollments within 24 hours. If you don't see them in your dashboard, please contact support at{" "}
                    <a href="mailto:contact@zefrix.com" className="underline text-yellow-400">contact@zefrix.com</a>
                  </p>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Payment Details
                </h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <span className="font-mono text-green-400">
                      {paymentId || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-400 font-semibold">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#D92A63]/20 to-[#FF654B]/20 rounded-lg p-6 mb-8 text-left border border-[#D92A63]/30">
                <h3 className="text-lg font-semibold text-white mb-3">
                  📧 What’s Next?
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>✓ Confirmation email sent</li>
                  <li>✓ Batch details arriving shortly</li>
                  <li>✓ Check your student dashboard</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/student-dashboard"
                  className="bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-8 py-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Go to Dashboard
                </Link>

                <Link
                  href="/courses"
                  className="border-2 border-white/20 px-8 py-4 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
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
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Enrollment Issue
              </h1>

              <p className="text-xl text-gray-300 mb-6">
                Payment went through, but enrollment needs manual help.
              </p>

              <div className="bg-red-500/10 rounded-lg p-6 mb-8 border border-red-500/30 text-left">
                <p className="text-gray-300 text-sm mb-2">
                  Please contact support with your payment ID:
                </p>
                <p className="font-mono text-yellow-400">
                  {paymentId || "N/A"}
                </p>
                <p className="text-gray-300 text-sm mt-3">
                  Email:{" "}
                  <a
                    href="mailto:support@zefrix.com"
                    className="underline text-[#FFD700]"
                  >
                    support@zefrix.com
                  </a>
                </p>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/student-dashboard"
                  className="border-2 border-white/20 px-8 py-4 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
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

/* =========================
   Page Wrapper (Suspense)
   ========================= */
export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0F3460] text-white text-xl">
          Loading payment status…
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
