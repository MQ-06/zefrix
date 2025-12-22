'use client';

interface CreatorCourseCardProps {
  course: {
    id: string;
    slug: string;
    title: string;
    instructor: string;
    instructorImage: string;
    image: string;
    price: number;
    originalPrice: number;
    sections: number;
    duration: number;
    students: number;
  };
}

interface CreatorCourseCardPropsWithHandler extends CreatorCourseCardProps {
  onViewClass?: (classId: string) => void;
}

export default function CreatorCourseCard({ course, onViewClass }: CreatorCourseCardPropsWithHandler) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onViewClass) {
      onViewClass(course.id);
    }
  };

  return (
    <div onClick={handleClick} className="creator-course-card" style={{ cursor: onViewClass ? 'pointer' : 'default' }}>
      <div className="creator-course-image-wrap">
        <img
          alt={course.title}
          loading="eager"
          src={course.image}
          className="creator-course-image"
        />
        <div className="creator-course-teacher-wrap">
          <img
            alt={course.instructor}
            loading="eager"
            src={course.instructorImage}
            className="creator-course-instructor-img"
          />
          <div>{course.instructor}</div>
        </div>
      </div>
      <div className="creator-course-info">
        <h3 className="creator-course-title">{course.title}</h3>
        <div className="creator-course-meta">
          <div className="creator-course-meta-item">
            <img
              alt=""
              loading="eager"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg"
              className="creator-course-meta-icon"
            />
            <div className="creator-course-meta-text">{course.sections} Sections</div>
          </div>
          <div className="creator-course-meta-item">
            <img
              alt=""
              loading="eager"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg"
              className="creator-course-meta-icon"
            />
            <div className="creator-course-meta-text">{course.duration} Days</div>
          </div>
          <div className="creator-course-meta-item">
            <img
              alt=""
              loading="eager"
              src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg"
              className="creator-course-meta-icon"
            />
            <div className="creator-course-meta-text">{course.students} Students</div>
          </div>
        </div>
      </div>
      <div className="creator-course-bottom">
        <div className="creator-course-price-wrap">
          <h4 className="creator-course-price">₹{course.price.toFixed(2)}</h4>
        </div>
      </div>
    </div>
  );
}

