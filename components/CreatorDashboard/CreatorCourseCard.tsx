'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_COURSE_IMAGE } from '@/lib/constants';

interface ClassData {
  classId: string;
  title: string;
  creatorName?: string;
  videoLink?: string;
  thumbnailUrl?: string;
  price: number;
  numberSessions: number;
  scheduleType?: 'one-time' | 'recurring';
  [key: string]: any;
}

interface CreatorCourseCardProps {
  classData: ClassData;
  onViewClass?: (classId: string) => void;
}

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
  }
}

export default function CreatorCourseCard({ classData, onViewClass }: CreatorCourseCardProps) {
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchEnrollmentCount = async () => {
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        setLoadingStats(false);
        return;
      }

      try {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const q = window.query(enrollmentsRef, window.where('classId', '==', classData.classId));
        const snapshot = await window.getDocs(q);
        setEnrollmentCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching enrollment count:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchEnrollmentCount();
  }, [classData.classId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onViewClass) {
      onViewClass(classData.classId);
    }
  };

  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = classData.thumbnailUrl || classData.videoLink || DEFAULT_COURSE_IMAGE;
  const instructorName = classData.creatorName || 'Creator';
  const instructorInitials = instructorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const instructorImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=D92A63&color=fff&size=200`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imageError) {
      setImageError(true);
      e.currentTarget.src = DEFAULT_COURSE_IMAGE;
    }
  };

  return (
    <div onClick={handleClick} className="creator-course-card" style={{ cursor: onViewClass ? 'pointer' : 'default' }}>
      <div className="creator-course-image-wrap">
        <img
          alt={classData.title}
          loading="lazy"
          src={thumbnailUrl}
          className="creator-course-image"
          onError={handleImageError}
        />
        <div className="creator-course-teacher-wrap">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D92A63 0%, #FF654B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '600',
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            {instructorInitials}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '500',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px'
          }}>
            {instructorName}
          </div>
        </div>
      </div>
      <div className="creator-course-info">
        <h3 className="creator-course-title" style={{
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#fff',
          lineHeight: '1.4',
          minHeight: '2.8em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {classData.title}
        </h3>
        <div className="creator-course-meta" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div className="creator-course-meta-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            <img
              alt=""
              loading="lazy"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg"
              className="creator-course-meta-icon"
              style={{ width: '18px', height: '18px', flexShrink: 0 }}
            />
            <span style={{ fontWeight: '500' }}>
              {classData.numberSessions || 0} {classData.numberSessions === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <div className="creator-course-meta-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            <img
              alt=""
              loading="lazy"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg"
              className="creator-course-meta-icon"
              style={{ width: '18px', height: '18px', flexShrink: 0 }}
            />
            <span style={{ fontWeight: '500' }}>
              {loadingStats ? '...' : enrollmentCount} {enrollmentCount === 1 ? 'Student' : 'Students'}
            </span>
          </div>
          {classData.scheduleType && (
            <div className="creator-course-meta-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <img
                alt=""
                loading="lazy"
                src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg"
                className="creator-course-meta-icon"
                style={{ width: '18px', height: '18px', flexShrink: 0 }}
              />
              <span style={{ fontWeight: '500' }}>
                {classData.scheduleType === 'one-time' ? 'One-time' : 'Recurring'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="creator-course-bottom" style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: 'auto'
      }}>
        <div className="creator-course-price-wrap">
          <h4 className="creator-course-price" style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#FFD700',
            margin: 0
          }}>
            ₹{classData.price.toFixed(2)}
          </h4>
        </div>
      </div>
    </div>
  );
}

