'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, removeFromCart, clearCart, cartTotal } = useCart();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication
        const checkAuth = async () => {
            try {
                // Check if Firebase auth is available
                if (typeof window !== 'undefined' && window.firebaseAuth) {
                    const user = window.firebaseAuth.currentUser;
                    if (user) {
                        setIsAuthenticated(true);
                        setUserEmail(user.email || '');
                    } else {
                        // Redirect to login
                        router.push('/signup-login?redirect=/checkout');
                        return;
                    }
                } else {
                    // Wait for Firebase to load
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
            alert('Your cart is empty!');
            return;
        }

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            const options = {
                key: 'rzp_test_RbORWjnwK5rV3J', // Razorpay test key
                amount: cartTotal * 100, // Amount in paise
                currency: 'USD',
                name: 'Zefrix',
                description: 'Course Purchase',
                image: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/69111edc833f0aade04d058d_6907f6cf8f1c1a9c8e68ea5c_logo.png',
                handler: function (response: any) {
                    // Payment successful
                    alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);

                    // Here you would typically:
                    // 1. Send payment details to your backend
                    // 2. Enroll user in courses
                    // 3. Send confirmation email

                    clearCart();
                    router.push('/student-dashboard');
                },
                prefill: {
                    email: userEmail,
                },
                theme: {
                    color: '#D92A63',
                },
                modal: {
                    ondismiss: function () {
                        console.log('Payment cancelled');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        };
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

    if (cart.length === 0) {
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

    return (
        <div className="min-h-screen pt-32 pb-16 bg-gradient-to-b from-[#1A1A2E] to-[#0F3460]">
            <div className="container max-w-6xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-white mb-8">Checkout</h1>

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
                                            ${item.price.toFixed(2)} USD
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
                                    <span>${cartTotal.toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Tax</span>
                                    <span>$0.00 USD</span>
                                </div>
                                <div className="border-t border-white/10 pt-4">
                                    <div className="flex justify-between text-white text-xl font-bold">
                                        <span>Total</span>
                                        <span>${cartTotal.toFixed(2)} USD</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                className="w-full bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-8 py-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#D92A63]/30 mb-4"
                            >
                                Proceed to Payment
                            </button>

                            <Link
                                href="/courses"
                                className="block w-full text-center border-2 border-white/20 px-8 py-4 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
                            >
                                Continue Shopping
                            </Link>

                            <div className="mt-6 p-4 bg-white/5 rounded-lg">
                                <p className="text-gray-400 text-sm">
                                    <strong className="text-white">Note:</strong> This is a demo checkout. In production, you'll need to configure your Razorpay API keys.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
