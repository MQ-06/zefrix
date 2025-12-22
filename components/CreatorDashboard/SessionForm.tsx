'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './SessionForm.module.css';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    doc: any;
    getDoc: any;
    updateDoc: any;
    serverTimestamp: any;
    setDoc: any;
    collection: any;
    addDoc: any;
    query: any;
    where: any;
    getDocs: any;
    deleteDoc: any;
    Timestamp: any;
  }
}

interface Session {
  sessionNumber: number;
  date: string;
  time: string;
  meetLink: string;
}

interface BankDetails {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  accountHolderName: string;
  upiId?: string;
}

interface SessionFormProps {
  classId: string;
  className: string;
  numberOfSessions: number;
  scheduleType: 'one-time' | 'recurring';
  startDate?: string;
  endDate?: string;
  recurringStartTime?: string;
  recurringEndTime?: string;
  days?: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SessionForm({
  classId,
  className,
  numberOfSessions,
  scheduleType,
  startDate,
  endDate,
  recurringStartTime,
  recurringEndTime,
  days,
  onSuccess,
  onCancel
}: SessionFormProps) {
  const { showSuccess, showError } = useNotification();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    ifsc: '',
    bankName: '',
    accountHolderName: '',
    upiId: ''
  });
  const [loading, setLoading] = useState(false);
  const [formFilled, setFormFilled] = useState(false);

  useEffect(() => {
    // Initialize sessions array based on number of sessions
    // For one-time classes, only allow 1 session
    const sessionsCount = scheduleType === 'one-time' ? 1 : numberOfSessions;
    const initialSessions: Session[] = [];
    for (let i = 1; i <= sessionsCount; i++) {
      initialSessions.push({
        sessionNumber: i,
        date: '',
        time: '',
        meetLink: ''
      });
    }
    setSessions(initialSessions);

    // Check if form is already filled
    checkFormStatus();
  }, [classId, numberOfSessions, scheduleType]);

  const checkFormStatus = async () => {
    if (!window.firebaseDb || !window.doc || !window.getDoc || !window.firebaseAuth) {
      return;
    }

    try {
      const currentUser = window.firebaseAuth?.currentUser;
      if (!currentUser) return;

      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      const classSnap = await window.getDoc(classRef);
      
      // Get bank details from user document (preferred location)
      const userRef = window.doc(window.firebaseDb, 'users', currentUser.uid);
      const userSnap = await window.getDoc(userRef);
      
      // Load sessions from class document
      if (classSnap.exists()) {
        const classData = classSnap.data();
        if (classData.sessions && classData.sessions.length > 0) {
          setSessions(classData.sessions);
        }
      }

      // Load bank details from user document (preferred) or fallback to class document
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.bankAccountNumber || userData.bankAccountHolderName) {
          setBankDetails({
            accountHolderName: userData.bankAccountHolderName || '',
            accountNumber: userData.bankAccountNumber || '',
            ifsc: userData.bankIFSC || '',
            bankName: userData.bankName || '',
            upiId: userData.upiId || ''
          });
          // If bank details and sessions exist, form is filled
          if (classSnap.exists() && classSnap.data().sessions?.length > 0) {
            setFormFilled(true);
          }
        }
      } else if (classSnap.exists()) {
        // Fallback: check class document (for backward compatibility)
        const classData = classSnap.data();
        if (classData.bankDetails) {
          setBankDetails(classData.bankDetails);
          if (classData.sessions && classData.sessions.length > 0) {
            setFormFilled(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking form status:', error);
    }
  };

  const handleSessionChange = (index: number, field: keyof Session, value: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[index] = {
      ...updatedSessions[index],
      [field]: value
    };
    setSessions(updatedSessions);
  };

  const handleBankDetailChange = (field: keyof BankDetails, value: string) => {
    setBankDetails({
      ...bankDetails,
      [field]: value
    });
  };

  const validateForm = async (): Promise<boolean> => {
    // Validate all sessions have date, time, and meet link
    for (const session of sessions) {
      if (!session.date || !session.time || !session.meetLink) {
        showError(`Please fill all fields for Session ${session.sessionNumber}`);
        return false;
      }
      
      // Validate Meet link format
      if (!session.meetLink.includes('meet.google.com') && !session.meetLink.includes('zoom.us') && !session.meetLink.startsWith('http')) {
        showError(`Please enter a valid meeting link for Session ${session.sessionNumber}`);
        return false;
      }
    }

    // Fetch class data to validate against original schedule
    if (window.firebaseDb && window.doc && window.getDoc) {
      try {
        const classRef = window.doc(window.firebaseDb, 'classes', classId);
        const classSnap = await window.getDoc(classRef);
        
        if (classSnap.exists()) {
          const classData = classSnap.data();
          
          // Validate one-time class
          if (scheduleType === 'one-time') {
            // Only 1 session allowed for one-time
            if (sessions.length !== 1) {
              showError('One-time classes can only have 1 session');
              return false;
            }
            
            const session = sessions[0];
            
            // Check if class has one-time date/time (field names: date, startTime, endTime)
            if (classData.date && classData.startTime) {
              const classDate = new Date(classData.date);
              const sessionDate = new Date(session.date);
              
              // Compare dates (ignore time for date comparison)
              if (classDate.toDateString() !== sessionDate.toDateString()) {
                showError(`Session date must match the class date: ${classData.date}`);
                return false;
              }
              
              // Compare time
              if (classData.startTime !== session.time) {
                showError(`Session time must match the class start time: ${classData.startTime}`);
                return false;
              }
            }
          }
          
          // Validate recurring class
          if (scheduleType === 'recurring') {
            const classStartDate = startDate || classData.recurringStartDate || classData.startDate;
            const classEndDate = endDate || classData.recurringEndDate || classData.endDate;
            const classDays = days || classData.days || classData.recurringDays || [];
            const classStartTime = recurringStartTime || classData.recurringStartTime || classData.startTime;
            
            if (classStartDate && classEndDate) {
              const start = new Date(classStartDate);
              const end = new Date(classEndDate);
              
              // Validate each session
              for (const session of sessions) {
                const sessionDate = new Date(session.date);
                
                // Check if session date is within class date range
                if (sessionDate < start || sessionDate > end) {
                  showError(`Session ${session.sessionNumber} date (${session.date}) must be between ${classStartDate} and ${classEndDate}`);
                  return false;
                }
                
                // Check if session is on allowed day
                if (classDays.length > 0) {
                  const sessionDay = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
                  const sessionDayShort = sessionDay.substring(0, 3); // Mon, Tue, etc.
                  const dayMatch = classDays.some((day: string) => 
                    day.toLowerCase().includes(sessionDay.toLowerCase()) || 
                    day.toLowerCase().includes(sessionDayShort.toLowerCase())
                  );
                  
                  if (!dayMatch) {
                    showError(`Session ${session.sessionNumber} is on ${sessionDay}, but class is only scheduled for: ${classDays.join(', ')}`);
                    return false;
                  }
                }
                
                // Check if session time matches class start time
                if (classStartTime && session.time !== classStartTime) {
                  showError(`Session ${session.sessionNumber} time must match the class start time: ${classStartTime}`);
                  return false;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error validating against class data:', error);
        // Continue with basic validation if class data fetch fails
      }
    }

    // Validate bank details
    if (!bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.bankName || !bankDetails.accountHolderName) {
      showError('Please fill all required bank details');
      return false;
    }

    // Validate IFSC format (11 characters, alphanumeric)
    if (bankDetails.ifsc.length !== 11) {
      showError('IFSC code must be 11 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    if (!window.firebaseDb || !window.doc || !window.updateDoc || !window.serverTimestamp || 
        !window.collection || !window.addDoc || !window.query || !window.where || !window.getDocs || !window.deleteDoc) {
      showError('Firebase not ready. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      // Get current user (creator)
      const currentUser = window.firebaseAuth?.currentUser;
      if (!currentUser) {
        showError('User not authenticated');
        return;
      }

      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      const userRef = window.doc(window.firebaseDb, 'users', currentUser.uid);
      
      // Get class data for className
      const classSnap = await window.getDoc(classRef);
      const className = classSnap.exists() ? classSnap.data().title : 'Class';
      
      // Delete existing sessions for this class
      const sessionsRef = window.collection(window.firebaseDb, 'sessions');
      const existingSessionsQuery = window.query(sessionsRef, window.where('classId', '==', classId));
      const existingSessionsSnapshot = await window.getDocs(existingSessionsQuery);
      console.log(`🗑️ Deleting ${existingSessionsSnapshot.size} existing sessions for class ${classId}`);
      existingSessionsSnapshot.forEach(async (doc: any) => {
        const docRef = window.doc(window.firebaseDb, 'sessions', doc.id);
        await window.deleteDoc(docRef);
      });
      
      // Create individual session documents in sessions collection
      console.log(`📝 Creating ${sessions.length} session documents`);
      for (const session of sessions) {
        // Combine date and time into a single datetime
        const sessionDateTime = new Date(`${session.date}T${session.time}`);
        console.log(`📅 Creating session ${session.sessionNumber}:`, {
          date: session.date,
          time: session.time,
          datetime: sessionDateTime,
          meetLink: session.meetLink
        });
        
        const sessionData = {
          classId: classId,
          className: className,
          sessionNumber: session.sessionNumber,
          sessionDate: window.Timestamp?.fromDate?.(sessionDateTime) || sessionDateTime,
          sessionTime: session.time,
          meetingLink: session.meetLink,
          creatorId: currentUser.uid,
          createdAt: window.serverTimestamp()
        };
        
        const docRef = await window.addDoc(sessionsRef, sessionData);
        console.log(`✅ Created session document: ${docRef.id}`);
      }
      console.log(`✅ All ${sessions.length} sessions created successfully`);
      
      // Update class with sessions array (for backward compatibility and admin view)
      await window.updateDoc(classRef, {
        sessions: sessions,
        formFilledAt: window.serverTimestamp(),
        formStatus: 'completed',
        updatedAt: window.serverTimestamp()
      });

      // Update user document with bank details (for payout processing)
      await window.updateDoc(userRef, {
        bankAccountHolderName: bankDetails.accountHolderName,
        bankAccountNumber: bankDetails.accountNumber,
        bankIFSC: bankDetails.ifsc,
        bankName: bankDetails.bankName,
        upiId: bankDetails.upiId || '',
        bankDetailsUpdatedAt: window.serverTimestamp()
      }, { merge: true });

      showSuccess('Session details and bank information saved successfully!');
      setFormFilled(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving form:', error);
      showError(`Failed to save form: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {formFilled ? 'Update Session Details' : 'Fill Session Details & Bank Information'}
        </h2>
        <p className={styles.formSubtitle}>
          Class: <strong>{className}</strong> ({numberOfSessions} {numberOfSessions === 1 ? 'Session' : 'Sessions'})
        </p>
        {formFilled && (
          <div className={styles.formStatus}>
            ✓ Form already filled. You can update the details below.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Sessions Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Session Details - Google Meet Links
          </h3>
          <p className={styles.sectionDescription}>
            Please provide the Google Meet link, date, and time for each session.
          </p>

          <div className={styles.sessionsList}>
            {sessions.map((session, index) => (
              <div key={index} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <h4>Session {session.sessionNumber}</h4>
                </div>
                <div className={styles.sessionFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      value={session.date}
                      onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Time <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="time"
                      value={session.time}
                      onChange={(e) => handleSessionChange(index, 'time', e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                      Google Meet Link <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="url"
                      value={session.meetLink}
                      onChange={(e) => handleSessionChange(index, 'meetLink', e.target.value)}
                      className={styles.input}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      required
                    />
                    <small className={styles.helpText}>
                      Enter the full Google Meet link for this session
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Bank Account Details
          </h3>
          <p className={styles.sectionDescription}>
            Your bank details will be used for payment processing when students enroll in your classes.
          </p>

          <div className={styles.bankDetailsGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Account Holder Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={bankDetails.accountHolderName}
                onChange={(e) => handleBankDetailChange('accountHolderName', e.target.value)}
                className={styles.input}
                placeholder="John Doe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Account Number <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={bankDetails.accountNumber}
                onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)}
                className={styles.input}
                placeholder="1234567890"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                IFSC Code <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={bankDetails.ifsc}
                onChange={(e) => handleBankDetailChange('ifsc', e.target.value.toUpperCase())}
                className={styles.input}
                placeholder="SBIN0001234"
                maxLength={11}
                required
              />
              <small className={styles.helpText}>11 characters (e.g., SBIN0001234)</small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Bank Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => handleBankDetailChange('bankName', e.target.value)}
                className={styles.input}
                placeholder="State Bank of India"
                required
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>
                UPI ID (Optional)
              </label>
              <input
                type="text"
                value={bankDetails.upiId || ''}
                onChange={(e) => handleBankDetailChange('upiId', e.target.value)}
                className={styles.input}
                placeholder="yourname@paytm"
              />
              <small className={styles.helpText}>Optional: Your UPI ID for faster payments</small>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : formFilled ? 'Update Details' : 'Save Details'}
          </button>
        </div>
      </form>
    </div>
  );
}

