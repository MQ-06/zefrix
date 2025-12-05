// ===================================
// TYPE DEFINITIONS FOR CREATOR DASHBOARD
// ===================================

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'creator' | 'student' | 'admin';
  isProfileComplete: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface CreatorProfile {
  uid: string;
  name: string;
  bio?: string;
  skills?: string[];
  phoneNumber?: string;
  profileImage?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  subCategory: string;
  instructor: string;
  instructorId: string;
  instructorImage: string;
  image: string;
  videoLink?: string;
  price: number;
  originalPrice: number;
  sections: number;
  duration: number; // in days
  students: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  whatStudentsWillLearn?: string[];
  maxSeats?: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Batch {
  id: string;
  courseId: string;
  type: 'one-time' | 'recurring';
  date?: string; // For one-time sessions
  startDate?: string; // For recurring batches
  endDate?: string; // For recurring batches
  startTime: string;
  endTime: string;
  days?: string[]; // For recurring batches: ['Monday', 'Tuesday', etc.]
  meetingLink?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  enrolledStudents: string[]; // Array of student UIDs
  maxStudents?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  enrolledCourses: string[]; // Array of course IDs
  enrolledBatches: string[]; // Array of batch IDs
}

export interface ClassFormData {
  title: string;
  subtitle: string;
  category: string;
  subCategory: string;
  description: string;
  whatStudentsWillLearn: string;
  level: string;
  videoLink: string;
  price: number;
  maxSeats?: number;
  scheduleType: 'one-time' | 'recurring';
  // One-time fields
  date?: string;
  startTime?: string;
  endTime?: string;
  // Recurring fields
  days?: string[];
  startDate?: string;
  endDate?: string;
  recurringStartTime?: string;
  recurringEndTime?: string;
}

export interface BatchFormData {
  date?: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  bio?: string;
  skills?: string;
  phoneNumber?: string;
}

export interface CategoryData {
  [key: string]: string[];
}

export const CATEGORIES: CategoryData = {
  "Dance & Performing Arts": [
    "Dance (Hip-Hop, Contemporary, Bollywood, Freestyle)",
    "Acting / Theatre / Stage Presence",
    "Movement & Expression"
  ],
  "Music & Singing": [
    "Singing (Western, Bollywood, Classical, Rap)",
    "Songwriting",
    "Music Production & Mixing",
    "Instrument Training (Guitar, Piano, Drums)"
  ],
  "Design & Creativity": [
    "Drawing / Illustration",
    "Graphic Design / Canva / Photoshop",
    "Animation / Motion Graphics",
    "Video Editing / Reels Creation"
  ],
  "Content & Creator Skills": [
    "YouTube Strategy",
    "Social Media Growth",
    "Reels / Short-form Content",
    "Personal Branding"
  ],
  "Communication & Confidence": [
    "Public Speaking",
    "Spoken English",
    "Interview Skills",
    "Presentation & Personality Development"
  ],
  "Wellness & Lifestyle": [
    "Yoga / Meditation",
    "Fitness / Home Workouts",
    "Nutrition",
    "Mental Wellness / Productivity"
  ],
  "Tech & Digital Skills": [
    "AI Tools (ChatGPT, Midjourney, Runway, Notion)",
    "Web Design / Coding Basics",
    "No-Code Tools (Bubble, Framer)",
    "App & Website Building"
  ],
  "Cooking & Culinary Arts": [
    "Home Cooking / Baking",
    "Coffee Art / Mixology",
    "Regional Cuisines / Street Food / Healthy Recipes"
  ],
  "Fashion, Styling & Beauty": [
    "Fashion Styling",
    "Makeup / Skincare / Grooming",
    "Outfit Aesthetics / Capsule Wardrobe",
    "Haircare & Personal Care"
  ],
  "Business, Career & Freelancing": [
    "Freelancing / Fiverr / Upwork",
    "Resume & LinkedIn Building",
    "Career Clarity / Productivity",
    "Entrepreneurship for Creators"
  ],
  "Language & Culture": [
    "English Communication",
    "Spanish / French / Hindi for Foreigners",
    "Cultural Exchange / Travel Learning"
  ],
  "Gaming & Esports": [
    "Game Streaming / Esports Skills",
    "Content Creation for Gamers"
  ],
  "Video, Photography & Filmmaking": [
    "Photography Basics / Smartphone Photography",
    "Videography / Cinematography",
    "Video Editing (Premiere Pro, DaVinci Resolve)"
  ]
};

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];
