'use client';

import { useState, useEffect } from 'react';

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

  const thumbnailUrl = classData.thumbnailUrl || classData.videoLink || 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b861_course-12.jpg';
  const instructorName = classData.creatorName || 'Creator';
  const instructorImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=D92A63&color=fff&size=200`;

  return (
    <div onClick={handleClick} className="creator-course-card" style={{ cursor: onViewClass ? 'pointer' : 'default' }}>
      <div className="creator-course-image-wrap">
        <img
          alt={classData.title}
          loading="lazy"
          src={thumbnailUrl}
          className="creator-course-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b861_course-12.jpg';
          }}
        />
        <div className="creator-course-teacher-wrap">
          <img
            alt={instructorName}
            loading="lazy"
            src={instructorImage}
            className="creator-course-instructor-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=D92A63&color=fff&size=200`;
            }}
          />
          <div>{instructorName}</div>
        </div>
      </div>
      <div className="creator-course-info">
        <h3 className="creator-course-title">{classData.title}</h3>
        <div className="creator-course-meta">
          <div className="creator-course-meta-item">
            <img
              alt=""
              loading="lazy"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg"
              className="creator-course-meta-icon"
            />
            <div className="creator-course-meta-text">{classData.numberSessions || 0} {classData.numberSessions === 1 ? 'Session' : 'Sessions'}</div>
          </div>
          <div className="creator-course-meta-item">
            <img
              alt=""
              loading="lazy"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg"
              className="creator-course-meta-icon"
            />
            <div className="creator-course-meta-text">
              {loadingStats ? '...' : enrollmentCount} {enrollmentCount === 1 ? 'Student' : 'Students'}
            </div>
          </div>
          {classData.scheduleType && (
            <div className="creator-course-meta-item">
              <img
                alt=""
                loading="lazy"
                src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg"
                className="creator-course-meta-icon"
              />
              <div className="creator-course-meta-text">
                {classData.scheduleType === 'one-time' ? 'One-time' : 'Recurring'}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="creator-course-bottom">
        <div className="creator-course-price-wrap">
          <h4 className="creator-course-price">₹{classData.price.toFixed(2)}</h4>
        </div>
      </div>
    </div>
  );
}

