import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="pt-32 pb-16 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity duration-200"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

