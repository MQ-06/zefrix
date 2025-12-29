// Shared constants for the application

// Default fallback image for courses/classes
export const DEFAULT_COURSE_IMAGE = 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg';

// Default fallback image for instructor/avatar
export const DEFAULT_AVATAR_IMAGE = 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg';

// Helper function to generate avatar URL with fallback
export const getAvatarUrl = (name: string, size: number = 128): string => {
  if (!name) return DEFAULT_AVATAR_IMAGE;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D92A63&color=fff&size=${size}`;
};

