import { categories, courses } from '@/lib/data';
import { notFound } from 'next/navigation';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function CategoryPage({ params }: PageProps) {
  const category = categories.find((c) => c.slug === params.slug);

  if (!category) {
    notFound();
  }

  const categoryCourses = courses.filter(
    (course) => course.categorySlug === category.slug
  );

  return (
    <div className="pt-32 pb-16 min-h-screen">
      <div className="container">
        <div
          className="rounded-2xl p-8 md:p-12 mb-12"
          style={{ backgroundColor: category.backgroundColor }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
            {category.name}
          </h1>
          <p className="text-dark/80 text-lg">
            Explore our {category.name.toLowerCase()} courses and enhance your
            skills.
          </p>
        </div>

        {categoryCourses.length > 0 ? (
          <>
            <div className="mb-8 text-gray-400">
              {categoryCourses.length} course
              {categoryCourses.length !== 1 ? 's' : ''} available
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No courses available in this category yet.
            </p>
            <Link
              href="/courses"
              className="inline-block bg-primary px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity duration-200"
            >
              Browse All Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

