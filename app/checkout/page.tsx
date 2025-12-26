'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

declare global {
    interface Window {
        Razorpay: any;
        firebaseAuth: any;
        firebaseDb: any;
        collection: any;
        addDoc: any;
        serverTimestamp: any;
        query: any;
        where: any;
        getDocs: any;
        doc: any;
        getDoc: any;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, removeFromCart, clearCart, cartTotal } = useCart();
    const { showError, showSuccess } = useNotification();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Load Razorpay script
        if (typeof window !== 'undefined' && !window.Razorpay) {
            const razorpayScript = document.createElement('script');
            razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
            razorpayScript.async = true;
            document.body.appendChild(razorpayScript);
        }

        // Load Firebase
        if (typeof window !== 'undefined' && (!window.firebaseAuth || !window.addDoc)) {
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = `
                import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
                import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
                import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
                
                const firebaseConfig = {
                    apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
                    authDomain: "zefrix-custom.firebaseapp.com",
                    projectId: "zefrix-custom",
                    storageBucket: "zefrix-custom.firebasestorage.app",
                    messagingSenderId: "50732408558",
                    appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
                    measurementId: "G-27HS1SWB5X"
                };

                // Check if app already exists
                const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
                window.firebaseAuth = getAuth(app);
                window.firebaseDb = getFirestore(app);
                window.collection = collection;
                window.addDoc = addDoc;
                window.query = query;
                window.where = where;
                window.getDocs = getDocs;
                window.doc = doc;
                window.getDoc = getDoc;
                console.log('✅ Firebase initialized in checkout with addDoc');
            `;
            document.body.appendChild(script);
        }

        // Check authentication
        const checkAuth = async () => {
            try {
                // Check if Firebase auth is available
                if (typeof window !== 'undefined' && window.firebaseAuth) {
                    const currentUser = window.firebaseAuth.currentUser;
                    if (currentUser) {
                        setIsAuthenticated(true);
                        setUserEmail(currentUser.email || '');
                        setUser(currentUser);
                    } else {
                        router.push('/signup-login?redirect=/checkout');
                        return;
                    }
                } else {
                    setTimeout(checkAuth, 500);
                    return;
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handlePayment = async () => {
        if (cart.length === 0) {
            showError('Your cart is empty!');
            return;
        }

        // Show confirmation dialog first
        setShowConfirmDialog(true);
    };

    const confirmPayment = async () => {
        setShowConfirmDialog(false);
        setIsProcessing(true);

        if (cart.length === 0) {
            showError('Your cart is empty!');
            setIsProcessing(false);
            return;
        }

        try {
            // Get current user
            const currentUser = window.firebaseAuth?.currentUser;
            if (!currentUser) {
                showError('User not found. Please login again.');
                router.push('/signup-login?redirect=/checkout');
                setIsProcessing(false);
                return;
            }

            // Check Razorpay is loaded
            if (!window.Razorpay) {
                showError('Payment gateway is loading. Please wait a moment and try again.');
                setIsProcessing(false);
                return;
            }

            // Create Razorpay order
            const createOrderResponse = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cart,
                }),
            });

            if (!createOrderResponse.ok) {
                const errorData = await createOrderResponse.json();
                const errorMsg = errorData.error || 'Failed to create order';

                // Provide specific guidance based on error type
                if (createOrderResponse.status === 406) {
                    throw new Error('Razorpay account may not be activated. Please check your Razorpay dashboard and ensure your test account is fully activated.');
                } else if (createOrderResponse.status === 401) {
                    throw new Error('Invalid Razorpay credentials. Please check your API keys.');
                } else if (createOrderResponse.status === 500) {
                    throw new Error(errorMsg);
                }

                throw new Error(errorMsg);
            }

            const orderData = await createOrderResponse.json();

            // Initialize Razorpay checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Zefrix',
                description: `Payment for ${cart.length} ${cart.length === 1 ? 'course' : 'courses'}`,
                order_id: orderData.orderId,
                prefill: {
                    name: currentUser.displayName || currentUser.email?.split('@')[0] || '',
                    email: currentUser.email || '',
                },
                theme: {
                    color: '#D92A63',
                },
                handler: async function (response: any) {
                    // Payment successful - verify and create enrollments
                    try {
                        await handlePaymentSuccess(response, currentUser);
                    } catch (error: any) {
                        console.error('Payment success handler error:', error);
                        showError(error.message || 'Failed to complete enrollment. Please contact support.');
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        // User closed the payment modal
                        setIsProcessing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                console.error('Payment failed:', response);
                showError(`Payment failed: ${response.error.description || 'Unknown error'}`);
                setIsProcessing(false);
            });

            razorpay.open();
        } catch (error: any) {
            console.error('Error initiating payment:', error);
            showError(error.message || 'Failed to initiate payment. Please try again.');
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async (paymentResponse: any, currentUser: any) => {
        const paymentId = paymentResponse.razorpay_payment_id;
        const orderId = paymentResponse.razorpay_order_id;
        
        try {
            // Step 1: Verify payment with backend
            const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    items: cart,
                    studentId: currentUser.uid,
                    studentEmail: currentUser.email,
                    studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
                }),
            });

            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                const errorMsg = errorData.error || 'Payment verification failed';
                console.error('Payment verification failed:', errorMsg);
                
                // Payment verification failed - payment might be invalid
                showError(`Payment verification failed: ${errorMsg}. Please contact support with Payment ID: ${paymentId}`);
                setIsProcessing(false);
                
                // Store failed verification for admin review
                try {
                    if (window.firebaseDb && window.collection && window.addDoc && window.serverTimestamp) {
                        const failedPaymentsRef = window.collection(window.firebaseDb, 'failed_payments');
                        await window.addDoc(failedPaymentsRef, {
                            paymentId: paymentId,
                            orderId: orderId,
                            studentId: currentUser.uid,
                            studentEmail: currentUser.email,
                            reason: 'payment_verification_failed',
                            error: errorMsg,
                            items: cart,
                            occurredAt: window.serverTimestamp(),
                            status: 'pending_review',
                        });
                    }
                } catch (logError) {
                    console.error('Failed to log payment verification error:', logError);
                }
                
                return;
            }

            const verifyData = await verifyResponse.json();
            console.log('✅ Payment verified successfully');

            // Step 2: Check Firebase is initialized
            if (!window.firebaseDb || !window.collection || !window.addDoc) {
                const errorMsg = 'Database connection error. Please refresh the page and try again.';
                console.error('Firebase not initialized during enrollment');
                
                // Store failed enrollment for admin to process manually
                await storeFailedEnrollment(paymentId, orderId, currentUser, cart, 'firebase_not_initialized', errorMsg);
                
                showError(`${errorMsg} Your payment was successful (Payment ID: ${paymentId}). Our team will enroll you manually. Please contact support if you don't see your enrollment within 24 hours.`);
                setIsProcessing(false);
                clearCart();
                return;
            }

            // Step 3: Check max seats before creating enrollments
            const seatCheckErrors: string[] = [];
            for (const item of cart) {
                try {
                    let classData: any = null;
                    if (window.firebaseDb && window.doc && window.getDoc) {
                        const classRef = window.doc(window.firebaseDb, 'classes', item.id);
                        const classSnap = await window.getDoc(classRef);
                        if (classSnap.exists()) {
                            classData = classSnap.data();
                        } else {
                            seatCheckErrors.push(`Class "${item.title}" no longer exists`);
                            continue;
                        }
                    }

                    // Check max seats
                    if (classData?.maxSeats && window.firebaseDb && window.collection && window.query && window.where && window.getDocs) {
                        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
                        const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', '==', item.id));
                        const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
                        const currentEnrollments = enrollmentsSnapshot.size;

                        if (currentEnrollments >= classData.maxSeats) {
                            seatCheckErrors.push(`Class "${item.title}" is full (${classData.maxSeats} seats)`);
                        }
                    }
                } catch (error: any) {
                    console.error(`Error checking class ${item.id}:`, error);
                    seatCheckErrors.push(`Error checking "${item.title}": ${error.message || 'Unknown error'}`);
                }
            }

            if (seatCheckErrors.length > 0) {
                const errorMsg = seatCheckErrors.join('; ');
                console.error('Seat check failed:', errorMsg);
                
                // Store failed enrollment
                await storeFailedEnrollment(paymentId, orderId, currentUser, cart, 'seats_full', errorMsg);
                
                showError(`${errorMsg}. Your payment was successful (Payment ID: ${paymentId}). Please contact support for a refund.`);
                setIsProcessing(false);
                clearCart();
                return;
            }

            // Step 4: Create enrollments with individual error handling
            const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
            const enrollmentResults: Array<{ success: boolean; item: any; error?: string }> = [];
            
            for (const item of cart) {
                try {
                    let classData: any = null;
                    if (window.firebaseDb && window.doc && window.getDoc) {
                        try {
                            const classRef = window.doc(window.firebaseDb, 'classes', item.id);
                            const classSnap = await window.getDoc(classRef);
                            if (classSnap.exists()) {
                                classData = classSnap.data();
                            }
                        } catch (error) {
                            console.error('Error fetching class data:', error);
                        }
                    }

                    const enrollmentData = {
                        studentId: currentUser.uid,
                        studentEmail: currentUser.email,
                        studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
                        classId: item.id,
                        className: item.title,
                        classPrice: item.price,
                        paymentId: paymentId,
                        orderId: orderId,
                        paymentStatus: 'completed',
                        enrolledAt: new Date(),
                        classType: classData?.scheduleType || 'one-time',
                        numberOfSessions: classData?.numberSessions || 1,
                        attended: 0,
                        status: 'active',
                    };

                    const enrollmentDocRef = await window.addDoc(enrollmentsRef, enrollmentData);
                    enrollmentResults.push({ success: true, item });
                    console.log(`✅ Enrollment created for class: ${item.title}`);

                    // Create creator notification (non-blocking)
                    try {
                      await fetch('/api/notifications/enrollment', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          classId: item.id,
                          className: item.title,
                          studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
                          studentEmail: currentUser.email || '',
                          enrollmentId: enrollmentDocRef.id,
                        }),
                      }).then(response => {
                        if (response.ok) {
                          console.log(`✅ Creator notification created for enrollment in class: ${item.title}`);
                        } else {
                          console.log(`⚠️ Failed to create creator notification for class: ${item.title} (non-blocking)`);
                        }
                      }).catch(err => {
                        console.log(`Notification creation failed for class ${item.title} (non-blocking):`, err);
                      });
                    } catch (notifError) {
                      console.log(`Notification error for class ${item.title} (non-blocking):`, notifError);
                    }
                } catch (error: any) {
                    console.error(`❌ Failed to create enrollment for ${item.title}:`, error);
                    enrollmentResults.push({ 
                        success: false, 
                        item, 
                        error: error.message || 'Unknown error' 
                    });
                }
            }

            // Step 5: Handle results
            const successfulEnrollments = enrollmentResults.filter(r => r.success);
            const failedEnrollments = enrollmentResults.filter(r => !r.success);

            if (failedEnrollments.length > 0) {
                // Some enrollments failed - store for admin review
                const failedItems = failedEnrollments.map(r => r.item);
                const failedErrors = failedEnrollments.map(r => r.error).join('; ');
                
                await storeFailedEnrollment(paymentId, orderId, currentUser, failedItems, 'enrollment_creation_failed', failedErrors);
                
                if (successfulEnrollments.length > 0) {
                    // Partial success
                    const successCount = successfulEnrollments.length;
                    const failCount = failedEnrollments.length;
                    showError(`${successCount} ${successCount === 1 ? 'class was' : 'classes were'} enrolled successfully, but ${failCount} ${failCount === 1 ? 'class' : 'classes'} failed. Your payment was successful (Payment ID: ${paymentId}). Our team will process the remaining enrollments. Please contact support if needed.`);
                } else {
                    // Complete failure
                    showError(`Enrollment creation failed. Your payment was successful (Payment ID: ${paymentId}). Our team will enroll you manually. Please contact support at contact@zefrix.com with your Payment ID.`);
                }
                
                setIsProcessing(false);
                clearCart();
                
                // Still redirect to thank you page but with a warning
                window.location.href = `/thank-you?payment_id=${paymentId}&order_id=${orderId}&status=partial_success&failed=${failedEnrollments.length}`;
                return;
            }

            // Step 6: All enrollments successful
            console.log('✅ All enrollments created successfully');
            setIsRedirecting(true);
            clearCart();
            window.location.href = `/thank-you?payment_id=${paymentId}&order_id=${orderId}&status=success`;
            
        } catch (error: any) {
            console.error('Error handling payment success:', error);
            const errorMessage = error.message || 'An unexpected error occurred';
            
            // Store failed enrollment for admin review
            await storeFailedEnrollment(paymentId, orderId, currentUser, cart, 'unexpected_error', errorMessage);
            
            showError(`Enrollment failed: ${errorMessage}. Your payment was successful (Payment ID: ${paymentId}). Please contact support at contact@zefrix.com with your Payment ID for assistance.`);
            setIsProcessing(false);
            clearCart();
        }
    };

    // Helper function to store failed enrollments for admin review
    const storeFailedEnrollment = async (
        paymentId: string,
        orderId: string,
        currentUser: any,
        items: any[],
        reason: string,
        errorDetails: string
    ) => {
        try {
            if (window.firebaseDb && window.collection && window.addDoc && window.serverTimestamp) {
                const failedEnrollmentsRef = window.collection(window.firebaseDb, 'failed_enrollments');
                await window.addDoc(failedEnrollmentsRef, {
                    paymentId: paymentId,
                    orderId: orderId,
                    studentId: currentUser.uid,
                    studentEmail: currentUser.email,
                    studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
                    items: items.map(item => ({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                    })),
                    reason: reason,
                    errorDetails: errorDetails,
                    occurredAt: window.serverTimestamp(),
                    status: 'pending_review',
                    resolved: false,
                });
                console.log('✅ Failed enrollment logged for admin review');
            }
        } catch (logError) {
            console.error('Failed to log enrollment error:', logError);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A1A2E] to-[#0F3460]">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    // Show loading/processing state during redirect to prevent empty cart flash
    if (isRedirecting || (isProcessing && cart.length === 0)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A1A2E] to-[#0F3460]">
                <div className="text-center">
                    <div className="text-white text-xl mb-4">Processing your payment...</div>
                    <div className="w-16 h-16 border-4 border-[#D92A63] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    if (cart.length === 0 && !isProcessing && !isRedirecting) {
        return (
            <div className="min-h-screen pt-32 pb-16 bg-gradient-to-b from-[#1A1A2E] to-[#0F3460]">
                <div className="container max-w-4xl mx-auto px-4">
                    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-12 border border-white/10 text-center">
                        <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h1>
                        <p className="text-gray-300 mb-8">
                            Please check out all the available courses and buy some courses that fulfill your needs.
                        </p>
                        <Link
                            href="/courses"
                            className="inline-block bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-8 py-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            View Courses
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const userInitial = user ? ((user.displayName || user.email || 'S')[0] || 'S').toUpperCase() : '';

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#0F3460]">
            {/* Student Header */}
            {user && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1A1A2E] to-[#2D1B3D] border-b border-white/10 shadow-lg">
                    <div className="container max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <Link href="/student-dashboard" className="text-white font-semibold hover:text-[#FF654B] transition-colors">
                                ← Back to Dashboard
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D92A63] to-[#FF654B] flex items-center justify-center text-white font-bold">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || 'Student'} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            userInitial
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold text-sm">
                                            {user.displayName || user.email?.split('@')[0] || 'Student'}
                                        </div>
                                        <div className="text-gray-300 text-xs">
                                            {user.email || 'Student account'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`${user ? 'pt-24' : 'pt-32'} pb-16`}>
                <div className="container max-w-6xl mx-auto px-4">
                    <h1 className="text-4xl font-bold text-white mb-8">Checkout</h1>

                    {/* Cart Preview Section */}
                    <div className="mb-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Cart Preview</h2>
                        <p className="text-gray-300 mb-4">Review your items before proceeding to payment</p>
                        <div className="text-white">
                            <span className="font-semibold">{cart.length}</span> {cart.length === 1 ? 'item' : 'items'} in your cart
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 flex gap-6"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-32 h-32 rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-gray-400 mb-4">by {item.instructor}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-2xl font-bold text-white">
                                                ₹{item.price.toFixed(2)} INR
                                            </p>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 sticky top-24">
                                <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Subtotal</span>
                                        <span>₹{cartTotal.toFixed(2)} INR</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Tax</span>
                                        <span>₹0.00 INR</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-4">
                                        <div className="flex justify-between text-white text-xl font-bold">
                                            <span>Total</span>
                                            <span>₹{cartTotal.toFixed(2)} INR</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || cart.length === 0}
                                    className="w-full bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-8 py-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#D92A63]/30 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                                </button>

                                <Link
                                    href="/courses"
                                    className="block w-full text-center border-2 border-white/20 px-8 py-4 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gradient-to-b from-[#1A1A2E] to-[#2D1B3D] rounded-xl p-8 border border-white/10 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-white mb-4">Confirm Payment</h3>
                        <p className="text-gray-300 mb-6">
                            You are about to proceed with payment for <strong className="text-white">{cart.length}</strong> {cart.length === 1 ? 'item' : 'items'}.
                        </p>
                        <div className="bg-white/5 rounded-lg p-4 mb-6">
                            <div className="flex justify-between text-white mb-2">
                                <span>Total Amount:</span>
                                <span className="font-bold text-xl">₹{cartTotal.toFixed(2)} INR</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1 border-2 border-white/20 px-6 py-3 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPayment}
                                className="flex-1 bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
