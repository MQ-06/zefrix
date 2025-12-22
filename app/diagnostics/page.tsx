'use client';

import { useEffect, useState } from 'react';

interface ResourceError {
    url: string;
    status: number;
    message: string;
    timestamp: string;
}

export default function DiagnosticsPage() {
    const [errors, setErrors] = useState<ResourceError[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Monitor network errors
        const originalFetch = window.fetch;
        const capturedErrors: ResourceError[] = [];

        // Override fetch to capture errors
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok && response.status === 406) {
                    capturedErrors.push({
                        url: args[0].toString(),
                        status: response.status,
                        message: response.statusText,
                        timestamp: new Date().toISOString(),
                    });
                    setErrors([...capturedErrors]);
                }
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };

        // Listen for resource errors
        const handleError = (event: ErrorEvent) => {
            if (event.message.includes('406')) {
                capturedErrors.push({
                    url: event.filename || 'Unknown',
                    status: 406,
                    message: event.message,
                    timestamp: new Date().toISOString(),
                });
                setErrors([...capturedErrors]);
            }
        };

        window.addEventListener('error', handleError);
        setLoading(false);

        return () => {
            window.fetch = originalFetch;
            window.removeEventListener('error', handleError);
        };
    }, []);

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>🔍 Network Diagnostics</h1>
            <p>This page monitors for HTTP 406 errors in real-time.</p>

            <div style={{ marginTop: '2rem' }}>
                <h2>Status: {loading ? 'Initializing...' : 'Monitoring'}</h2>

                {errors.length === 0 ? (
                    <div style={{
                        padding: '1rem',
                        background: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        color: '#155724'
                    }}>
                        ✓ No 406 errors detected
                    </div>
                ) : (
                    <div>
                        <h3 style={{ color: '#dc3545' }}>⚠️ Detected {errors.length} error(s):</h3>
                        {errors.map((error, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '1rem',
                                    margin: '0.5rem 0',
                                    background: '#f8d7da',
                                    border: '1px solid #f5c6cb',
                                    borderRadius: '4px',
                                    color: '#721c24',
                                }}
                            >
                                <div><strong>URL:</strong> {error.url}</div>
                                <div><strong>Status:</strong> {error.status}</div>
                                <div><strong>Message:</strong> {error.message}</div>
                                <div><strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#e7f3ff', borderRadius: '4px' }}>
                <h3>💡 Common Causes of 406 Errors:</h3>
                <ul>
                    <li>Third-party CDN tracking scripts (Webflow, etc.)</li>
                    <li>Browser extensions blocking requests</li>
                    <li>Ad blockers or privacy tools</li>
                    <li>Incorrect Accept headers</li>
                    <li>Server-side content negotiation issues</li>
                </ul>

                <h3>🔧 Quick Fixes:</h3>
                <ol>
                    <li>Disable browser extensions temporarily</li>
                    <li>Clear browser cache and cookies</li>
                    <li>Try incognito/private browsing mode</li>
                    <li>Check network tab in DevTools for specific failing requests</li>
                </ol>
            </div>
        </div>
    );
}
