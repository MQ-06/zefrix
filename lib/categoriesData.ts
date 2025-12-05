export interface CategoryDetail {
  id: string;
  slug: string;
  title: string;
  subcategories: string[];
}

export const categoryDetails: CategoryDetail[] = [
  {
    id: '1',
    slug: 'dance-performing-arts',
    title: 'Dance & Performing Arts',
    subcategories: [
      'Singing (Western, Bollywood, Classical, Rap)',
      'Songwriting',
      'Music Production & Mixing',
      'Instrument Training (Guitar, Piano, Drums)',
    ],
  },
  {
    id: '2',
    slug: 'music-singing',
    title: 'Music & Singing',
    subcategories: [
      'Singing (Western, Bollywood, Classical, Rap)',
      'Songwriting',
      'Music Production & Mixing',
      'Instrument Training (Guitar, Piano, Drums)',
    ],
  },
  {
    id: '3',
    slug: 'design-creativity',
    title: 'Design & Creativity',
    subcategories: [
      'Drawing / Illustration',
      'Graphic Design / Canva / Photoshop',
      'Animation / Motion Graphics',
      'Video Editing / Reels Creation',
    ],
  },
  {
    id: '4',
    slug: 'content-creator-skills',
    title: 'Content & Creator Skills',
    subcategories: [
      'YouTube Strategy',
      'Social Media Growth',
      'Reels / Short-form Content',
      'Personal Branding',
    ],
  },
  {
    id: '5',
    slug: 'communication-confidence',
    title: 'Communication & Confidence',
    subcategories: [
      'Public Speaking',
      'Spoken English',
      'Interview Skills',
      'Presentation & Personality Development',
    ],
  },
  {
    id: '6',
    slug: 'wellness-lifestyle',
    title: 'Wellness & Lifestyle',
    subcategories: [
      'Yoga / Meditation',
      'Fitness / Home Workouts',
      'Nutrition',
      'Mental Wellness / Productivity',
    ],
  },
  {
    id: '7',
    slug: 'tech-digital-skills',
    title: 'Tech & Digital Skills',
    subcategories: [
      'AI Tools (ChatGPT, Midjourney, Runway, Notion)',
      'Web Design / Coding Basics',
      'No-Code Tools (Bubble, Framer)',
      'App & Website Building',
    ],
  },
  {
    id: '8',
    slug: 'art-craft-diy',
    title: 'Art, Craft & DIY',
    subcategories: [
      'Painting / Sketching / Calligraphy',
      'Crafts / Resin Art / Handmade Jewelry',
      'Interior Décor & Aesthetics',
    ],
  },
  {
    id: '9',
    slug: 'cooking-culinary-arts',
    title: 'Cooking & Culinary Arts',
    subcategories: [
      'Home Cooking / Baking',
      'Coffee Art / Mixology',
      'Regional Cuisines / Street Food / Healthy Recipes',
    ],
  },
  {
    id: '10',
    slug: 'fashion-styling-beauty',
    title: 'Fashion, Styling & Beauty',
    subcategories: [
      'Fashion Styling',
      'Makeup / Skincare / Grooming',
      'Outfit Aesthetics / Capsule Wardrobe',
      'Haircare & Personal Care',
    ],
  },
  {
    id: '11',
    slug: 'business-career-freelancing',
    title: 'Business, Career & Freelancing',
    subcategories: [
      'Freelancing / Fiverr / Upwork',
      'Resume & LinkedIn Building',
      'Career Clarity / Productivity',
      'Entrepreneurship for Creators',
    ],
  },
  {
    id: '12',
    slug: 'language-culture',
    title: 'Language & Culture',
    subcategories: [
      'English Communication',
      'Spanish / French / Hindi for Foreigners',
      'Cultural Exchange / Travel Learning',
    ],
  },
  {
    id: '13',
    slug: 'gaming-esports',
    title: 'Gaming & Esports',
    subcategories: [
      'Game Streaming / Esports Skills',
      'Content Creation for Gamers',
    ],
  },
  {
    id: '14',
    slug: 'video-photography-filmmaking',
    title: 'Video, Photography & Filmmaking',
    subcategories: [
      'Photography Basics / Portrait / Product',
      'Video Production / Editing',
      'Cinematography / Storytelling',
      'Drone Photography / Videography',
    ],
  },
];

