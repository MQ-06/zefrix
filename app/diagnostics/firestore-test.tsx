'use client';

import { useEffect, useState } from 'react';

declare global {
    interface Window {
        firebaseDb: any;
        collection: any;
        query: any;
        where: any;
        getDocs: any;
    }
}

export default function FirestoreTest() {
    const [status, setStatus] = useState<string>('Initializing...');
    const [creators, setCreators] = useState<any[]>([]);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const testFirestore = async () => {
            try {
                setStatus('Waiting for Firebase...');

                // Wait for Firebase to be ready
                let attempts = 0;
                while (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
                    if (attempts++ > 100) {
                        throw new Error('Firebase initialization timeout after 10 seconds');
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                setStatus('Firebase ready! Fetching creators...');
                console.log('🔍 Testing Firestore connection...');

                // Try to fetch creators
                const usersRef = window.collection(window.firebaseDb, 'users');
                const q = window.query(usersRef, window.where('role', '==', 'creator'));

                console.log('📡 Executing query...');
                const querySnapshot = await window.getDocs(q);

                console.log(`✅ Query successful! Found ${querySnapshot.size} creators`);
                setStatus(`Query successful! Found ${querySnapshot.size} creators`);

                const creatorsData: any[] = [];
                querySnapshot.forEach((doc: any) => {
                    const data = doc.data();
                    console.log('Creator:', { id: doc.id, ...data });
                    creatorsData.push({ id: doc.id, ...data });
                });

                setCreators(creatorsData);

                // Also try to fetch all users to see what's in the database
                console.log('📡 Fetching all users...');
                const allUsersSnapshot = await window.getDocs(usersRef);
                console.log(`Found ${allUsersSnapshot.size} total users`);

                allUsersSnapshot.forEach((doc: any) => {
                    const data = doc.data();
                    console.log('User:', { id: doc.id, role: data.role, name: data.name, email: data.email });
                });

            } catch (err: any) {
                console.error('❌ Error:', err);
                setError(err.message);
                setStatus('Error occurred');
            }
        };

        testFirestore();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Firestore Connection Test</h1>

                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Status</h2>
                    <p className="text-lg">{status}</p>
                    {error && (
                        <div className="mt-4 p-4 bg-red-900/50 rounded">
                            <p className="text-red-200">Error: {error}</p>
                        </div>
                    )}
                </div>

                {creators.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Creators Found ({creators.length})</h2>
                        <div className="space-y-4">
                            {creators.map((creator) => (
                                <div key={creator.id} className="bg-gray-700 rounded p-4">
                                    <p><strong>ID:</strong> {creator.id}</p>
                                    <p><strong>Name:</strong> {creator.name}</p>
                                    <p><strong>Email:</strong> {creator.email}</p>
                                    <p><strong>Role:</strong> {creator.role}</p>
                                    <p><strong>Photo URL:</strong> {creator.photoURL || 'None'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <p className="text-gray-400">Check the browser console for detailed logs</p>
                </div>
            </div>
        </div>
    );
}
