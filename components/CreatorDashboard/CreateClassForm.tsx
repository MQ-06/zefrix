'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    doc: any;
    setDoc: any;
    serverTimestamp: any;
  }
}

const categories = [
  'Dance & Performing Arts',
  'Music & Singing',
  'Design & Creativity',
  'Content & Creator Skills',
  'Communication & Confidence',
  'Wellness & Lifestyle',
  'Tech & Digital Skills',
  'Cooking & Culinary Arts',
  'Fashion, Styling & Beauty',
  'Business, Career & Freelancing',
  'Language & Culture',
  'Gaming & Esports',
  'Video, Photography & Filmmaking',
];

const subCategories: Record<string, string[]> = {
  'Music & Singing': [
    'Singing (Western, Bollywood, Classical, Rap)',
    'Songwriting',
    'Music Production & Mixing',
    'Instrument Training (Guitar, Piano, Drums)',
  ],
  'Dance & Performing Arts': [
    'Dance (Hip-Hop, Contemporary, Bollywood, Freestyle)',
    'Acting / Theatre / Stage Presence',
    'Movement & Expression',
  ],
  'Design & Creativity': [
    'Drawing / Illustration',
    'Graphic Design / Canva / Photoshop',
    'Animation / Motion Graphics',
    'Video Editing / Reels Creation',
  ],
  'Content & Creator Skills': [
    'YouTube Strategy',
    'Social Media Growth',
    'Reels / Short-form Content',
    'Personal Branding',
  ],
  'Communication & Confidence': [
    'Public Speaking',
    'Spoken English',
    'Interview Skills',
    'Presentation & Personality Development',
  ],
  'Wellness & Lifestyle': [
    'Yoga / Meditation',
    'Fitness / Home Workouts',
    'Nutrition',
    'Mental Wellness / Productivity',
  ],
  'Tech & Digital Skills': [
    'AI Tools (ChatGPT, Midjourney, Runway, Notion)',
    'Web Design / Coding Basics',
    'No-Code Tools (Bubble, Framer)',
    'App & Website Building',
  ],
  'Cooking & Culinary Arts': [
    'Home Cooking / Baking',
    'Coffee Art / Mixology',
    'Regional Cuisines / Street Food / Healthy Recipes',
  ],
  'Fashion, Styling & Beauty': [
    'Fashion Styling',
    'Makeup / Skincare / Grooming',
    'Outfit Aesthetics / Capsule Wardrobe',
    'Haircare & Personal Care',
  ],
  'Business, Career & Freelancing': [
    'Freelancing / Fiverr / Upwork',
    'Resume & LinkedIn Building',
    'Career Clarity / Productivity',
    'Entrepreneurship for Creators',
  ],
  'Language & Culture': [
    'English Communication',
    'Spanish / French / Hindi for Foreigners',
    'Cultural Exchange / Travel Learning',
  ],
  'Gaming & Esports': [
    'Game Streaming / Esports Skills',
    'Content Creation for Gamers',
  ],
  'Video, Photography & Filmmaking': [
    'Photography Basics / Smartphone Photography',
    'Videography / Cinematography',
    'Video Editing (Premiere Pro, DaVinci Resolve)',
  ],
};

export default function CreateClassForm() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scheduleType, setScheduleType] = useState('one-time');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Wait for Firebase to be ready
  useEffect(() => {
    const checkFirebase = () => {
      if (window.firebaseAuth && window.firebaseDb && window.doc && window.setDoc && window.serverTimestamp) {
        setFirebaseReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkFirebase()) {
      return;
    }

    // Listen for firebaseReady event
    const handleFirebaseReady = () => {
      setFirebaseReady(true);
    };
    window.addEventListener('firebaseReady', handleFirebaseReady);

    // Also poll in case event is missed
    const interval = setInterval(() => {
      if (checkFirebase()) {
        clearInterval(interval);
        window.removeEventListener('firebaseReady', handleFirebaseReady);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      window.removeEventListener('firebaseReady', handleFirebaseReady);
    };
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Helper function to calculate minutes between two times
  const calculateMinutes = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    return endTotal - startTotal;
  };

  // Helper function to calculate number of sessions for recurring batches
  const calculateRecurringSessions = (
    startDate: string,
    endDate: string,
    selectedDays: string[]
  ): number => {
    if (selectedDays.length === 0) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMap: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    const selectedDayNumbers = selectedDays.map(day => dayMap[day]);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      if (selectedDayNumbers.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  // Helper function to calculate average days between sessions
  const calculateDaysBetween = (
    startDate: string,
    endDate: string,
    numberOfSessions: number
  ): number => {
    if (numberOfSessions <= 1) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(totalDays / (numberOfSessions - 1));
  };

  // Helper function to convert date + time to ISO string
  const createISOString = (date: string, time: string): string => {
    return new Date(`${date}T${time}:00`).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Double-check Firebase is ready (should already be ready from useEffect, but verify)
      if (!window.firebaseAuth || !window.firebaseDb || !window.doc || !window.setDoc || !window.serverTimestamp) {
        console.error('Firebase check failed:', {
          firebaseAuth: !!window.firebaseAuth,
          firebaseDb: !!window.firebaseDb,
          doc: !!window.doc,
          setDoc: !!window.setDoc,
          serverTimestamp: !!window.serverTimestamp,
          serverTimestampType: typeof window.serverTimestamp
        });
        
        // Try waiting a bit more
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds
        while ((!window.firebaseAuth || !window.firebaseDb || !window.doc || !window.setDoc || !window.serverTimestamp) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        // Final check
        if (!window.firebaseAuth || !window.firebaseDb || !window.doc || !window.setDoc) {
          throw new Error('Firebase not initialized. Please refresh the page and wait for Firebase to load before submitting.');
        }

        if (!window.serverTimestamp || typeof window.serverTimestamp !== 'function') {
          console.error('serverTimestamp check:', {
            exists: !!window.serverTimestamp,
            type: typeof window.serverTimestamp,
            isFunction: typeof window.serverTimestamp === 'function'
          });
          throw new Error('Firebase serverTimestamp not available. Please refresh the page and try again.');
        }
      }

      // Get current user
      const user = window.firebaseAuth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a class');
      }

      // Get form data
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const title = (formData.get('title') as string)?.trim();
      const subtitle = (formData.get('subtitle') as string)?.trim();
      const category = (formData.get('category') as string)?.trim();
      const subcategory = (formData.get('subcategory') as string)?.trim();
      const description = (formData.get('description') as string)?.trim();
      const whatStudentsWillLearn = (formData.get('learn') as string)?.trim();
      const level = (formData.get('level') as string)?.trim();
      const videoLink = (formData.get('videoLink') as string)?.trim() || '';
      const price = parseFloat(formData.get('price') as string);
      const maxSeats = formData.get('maxSeats') ? parseInt(formData.get('maxSeats') as string) : undefined;

      // Calculate session fields based on schedule type
      let startISO: string;
      let sessionLengthMinutes: number;
      let numberSessions: number;
      let daysBetweenSessions: number;

      if (scheduleType === 'one-time') {
        const date = formData.get('date') as string;
        const startTime = formData.get('startTime') as string;
        const endTime = formData.get('endTime') as string;

        if (!date || !startTime || !endTime) {
          throw new Error('Please fill all date and time fields for one-time session');
        }

        startISO = createISOString(date, startTime);
        sessionLengthMinutes = calculateMinutes(startTime, endTime);
        numberSessions = 1;
        daysBetweenSessions = 0;
      } else {
        // Recurring batch
        const startDate = formData.get('startDate') as string;
        const endDate = formData.get('endDate') as string;
        const recurringStartTime = formData.get('recurringStartTime') as string;
        const recurringEndTime = formData.get('recurringEndTime') as string;

        if (!startDate || !endDate || !recurringStartTime || !recurringEndTime) {
          throw new Error('Please fill all date and time fields for recurring batch');
        }

        if (selectedDays.length === 0) {
          throw new Error('Please select at least one day for recurring batch');
        }

        startISO = createISOString(startDate, recurringStartTime);
        sessionLengthMinutes = calculateMinutes(recurringStartTime, recurringEndTime);
        numberSessions = calculateRecurringSessions(startDate, endDate, selectedDays);
        daysBetweenSessions = calculateDaysBetween(startDate, endDate, numberSessions);
      }

      // Generate class ID
      const classId = `CLASS_${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare payload for n8n webhook
      const n8nPayload = {
        class_id: classId,
        creator_email: user.email || '',
        creator_name: user.displayName || user.email?.split('@')[0] || 'Creator',
        title: title,
        category: category,
        subcategory: subcategory,
        start: startISO,
        session_length_minutes: sessionLengthMinutes,
        number_sessions: numberSessions,
        days_between_sessions: daysBetweenSessions,
        notes: description || ''
      };

      // Send to n8n webhook (non-blocking - save to Firestore even if webhook fails)
      let webhookSuccess = false;
      let webhookErrorDetails: string = '';
      try {
        const webhookUrl = 'https://n8n.srv1137454.hstgr.cloud/webhook-test/class-create';
        console.log('🔔 Calling webhook:', webhookUrl);
        console.log('📦 Payload:', n8nPayload);
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nPayload),
          mode: 'cors', // Explicitly set CORS mode
        });

        console.log('📡 Webhook response status:', webhookResponse.status, webhookResponse.statusText);

        if (webhookResponse.ok) {
          webhookSuccess = true;
          const responseText = await webhookResponse.text();
          console.log('✅ Webhook call successful. Response:', responseText);
        } else {
          const errorText = await webhookResponse.text();
          webhookErrorDetails = `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`;
          console.warn('⚠️ Webhook returned non-OK status:', webhookResponse.status, webhookResponse.statusText);
          console.warn('Response body:', errorText);
        }
      } catch (webhookError: any) {
        // Log detailed error information
        webhookErrorDetails = webhookError.message || 'Unknown error';
        console.error('❌ Webhook call failed (non-blocking):', webhookError);
        console.error('Error type:', webhookError.name);
        console.error('Error message:', webhookError.message);
        console.error('Error stack:', webhookError.stack);
        
        // Check if it's a CORS error
        if (webhookError.message?.includes('CORS') || webhookError.message?.includes('Failed to fetch')) {
          console.warn('🚫 CORS issue detected. This is a browser security restriction.');
          console.warn('💡 Solution: Configure CORS headers in n8n webhook or use a proxy.');
          webhookErrorDetails = 'CORS error - n8n webhook needs CORS headers configured';
        }
      }

      // Prepare Firestore document
      const firestoreData = {
        classId: classId,
        creatorId: user.uid,
        creatorEmail: user.email || '',
        creatorName: user.displayName || user.email?.split('@')[0] || 'Creator',
        title: title,
        subtitle: subtitle,
        category: category,
        subCategory: subcategory,
        description: description,
        whatStudentsWillLearn: whatStudentsWillLearn,
        level: level,
        videoLink: videoLink,
        price: price,
        maxSeats: maxSeats,
        scheduleType: scheduleType as 'one-time' | 'recurring',
        startISO: startISO,
        sessionLengthMinutes: sessionLengthMinutes,
        numberSessions: numberSessions,
        daysBetweenSessions: daysBetweenSessions,
        status: 'pending',
        createdAt: window.serverTimestamp(),
        updatedAt: window.serverTimestamp(),
        // Store schedule details for display
        ...(scheduleType === 'one-time' && {
          date: formData.get('date') as string,
          startTime: formData.get('startTime') as string,
          endTime: formData.get('endTime') as string,
        }),
        ...(scheduleType === 'recurring' && {
          startDate: formData.get('startDate') as string,
          endDate: formData.get('endDate') as string,
          recurringStartTime: formData.get('recurringStartTime') as string,
          recurringEndTime: formData.get('recurringEndTime') as string,
          days: selectedDays,
        }),
      };

      // Write to Firestore
      await window.setDoc(window.doc(window.firebaseDb, 'classes', classId), firestoreData);

      // Send to n8n webhook via Next.js API route (avoids CORS issues)
      try {
        const n8nPayload = {
          class_id: classId,
          creator_email: user.email || '',
          creator_name: user.displayName || user.email?.split('@')[0] || 'Creator',
          title: title,
          category: category,
          subcategory: subcategory,
          start: startISO,
          session_length_minutes: sessionLengthMinutes,
          number_sessions: numberSessions,
          days_between_sessions: daysBetweenSessions,
          notes: description || ''
        };

        // Send via Next.js API route (server-side, no CORS issues)
        fetch('/api/webhook/class-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nPayload),
        }).then(response => {
          if (response.ok) {
            console.log('✅ Webhook notification sent successfully');
          } else {
            console.log('⚠️ Webhook notification failed (non-blocking)');
          }
        }).catch(err => {
          console.log('Webhook call failed (non-blocking):', err);
        });
      } catch (webhookError) {
        console.log('Webhook error (non-blocking):', webhookError);
      }

      // Show success message
      setSubmitMessage({ type: 'success', text: 'Class submitted successfully! Waiting for admin approval.' });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        form.reset();
        setSelectedCategory('');
        setSelectedDays([]);
        setScheduleType('one-time');
        setSubmitMessage(null);
      }, 2000);

    } catch (error: any) {
      console.error('Error creating class:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create class. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if Firebase isn't ready
  if (!firebaseReady) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px'
      }}>
        <div style={{ marginBottom: '1rem' }}>⏳</div>
        <div>Initializing Firebase...</div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>
          Please wait a moment
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="creator-form">
      <h5 className="creator-form-heading">Class Information Fields</h5>
      
      <div className="creator-form-group">
        <label htmlFor="title" className="creator-field-label">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          className="creator-form-input"
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="subtitle" className="creator-field-label">Subtitle</label>
        <input
          type="text"
          id="subtitle"
          name="subtitle"
          className="creator-form-input"
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="category" className="creator-field-label">Category</label>
        <select
          id="category"
          name="category"
          className="creator-form-input creator-select"
          value={selectedCategory}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && subCategories[selectedCategory] && (
        <div className="creator-form-group">
          <label htmlFor="subcategory" className="creator-field-label">Sub Category</label>
          <select
            id="subcategory"
            name="subcategory"
            className="creator-form-input creator-select"
            required
          >
            <option value="">Select a subcategory</option>
            {subCategories[selectedCategory].map((subcat) => (
              <option key={subcat} value={subcat}>
                {subcat}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="creator-form-group">
        <label htmlFor="description" className="creator-field-label">Description</label>
        <textarea
          id="description"
          name="description"
          className="creator-form-input creator-textarea"
          rows={4}
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="learn" className="creator-field-label">What Students Will Learn</label>
        <textarea
          id="learn"
          name="learn"
          className="creator-form-input creator-textarea"
          rows={4}
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="level" className="creator-field-label">Level</label>
        <input
          type="text"
          id="level"
          name="level"
          className="creator-form-input"
          placeholder="e.g., Beginner, Intermediate, Advanced"
          required
        />
      </div>

      <h5 className="creator-form-heading">Media</h5>
      <div className="creator-form-group">
        <label htmlFor="video-link" className="creator-field-label">Video Link</label>
        <input
          type="url"
          id="video-link"
          name="videoLink"
          className="creator-form-input"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <h5 className="creator-form-heading">Pricing</h5>
      <div className="creator-form-group">
        <label htmlFor="price" className="creator-field-label">Price (INR)</label>
        <input
          type="number"
          id="price"
          name="price"
          className="creator-form-input"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="max-seats" className="creator-field-label">Max Seats (Optional)</label>
        <input
          type="number"
          id="max-seats"
          name="maxSeats"
          className="creator-form-input"
          min="1"
        />
      </div>

      <h5 className="creator-form-heading">Schedule Type</h5>
      <div className="creator-radio-group">
        <label className="creator-radio-wrap">
          <input
            type="radio"
            name="scheduleType"
            value="one-time"
            checked={scheduleType === 'one-time'}
            onChange={(e) => setScheduleType(e.target.value)}
            className="creator-radio-input"
          />
          <span className="creator-radio-label">One-time Session</span>
        </label>
        <label className="creator-radio-wrap">
          <input
            type="radio"
            name="scheduleType"
            value="recurring"
            checked={scheduleType === 'recurring'}
            onChange={(e) => setScheduleType(e.target.value)}
            className="creator-radio-input"
          />
          <span className="creator-radio-label">Recurring Batch</span>
        </label>
      </div>

      {scheduleType === 'one-time' && (
        <div className="creator-one-time-fields">
          <div className="creator-form-group">
            <label htmlFor="date" className="creator-field-label">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="start-time" className="creator-field-label">Start Time</label>
            <input
              type="time"
              id="start-time"
              name="startTime"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="end-time" className="creator-field-label">End Time</label>
            <input
              type="time"
              id="end-time"
              name="endTime"
              className="creator-form-input"
              required
            />
          </div>
        </div>
      )}

      {scheduleType === 'recurring' && (
        <div className="creator-recurring-fields">
          <div className="creator-form-group">
            <label className="creator-field-label">Days</label>
            <div className="creator-pill-wrap">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="creator-pill-item">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="creator-pill-checkbox"
                  />
                  <span className="creator-pill-label">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="creator-form-group">
            <label htmlFor="start-date" className="creator-field-label">Start Date</label>
            <input
              type="date"
              id="start-date"
              name="startDate"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="end-date" className="creator-field-label">End Date</label>
            <input
              type="date"
              id="end-date"
              name="endDate"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="recurring-start-time" className="creator-field-label">Start Time</label>
            <input
              type="time"
              id="recurring-start-time"
              name="recurringStartTime"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="recurring-end-time" className="creator-field-label">End Time</label>
            <input
              type="time"
              id="recurring-end-time"
              name="recurringEndTime"
              className="creator-form-input"
              required
            />
          </div>
        </div>
      )}

      <button 
        type="submit" 
        className="creator-submit-btn"
        disabled={isSubmitting}
        style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
      </button>

      {submitMessage && (
        <div 
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            color: submitMessage.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {submitMessage.text}
        </div>
      )}
    </form>
  );
}

