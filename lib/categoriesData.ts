export interface CategoryDetail {
  id: string;
  slug: string;
  title: string;
  subcategories: string[];
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  benefits: string[];
}

export const categoryDetails: CategoryDetail[] = [
  {
    id: '1',
    slug: 'dance-performing-arts',
    title: 'Dance & Performing Arts',
    subcategories: [
      'Dance (Hip-Hop, Contemporary, Bollywood, Freestyle)',
      'Acting / Theatre / Stage Presence',
      'Movement & Expression',
    ],
    seoTitle: 'Online Dance Classes & Performing Arts Workshops | Learn Live',
    seoDescription: 'Join live online dance classes and performing arts workshops. Learn Hip-Hop, Contemporary, Bollywood, Theatre, and more from expert choreographers. Interactive sessions with real-time feedback.',
    keywords: ['online dance classes', 'learn dance online', 'live dance workshops', 'performing arts classes', 'hip-hop dance online', 'bollywood dance classes', 'theatre classes online'],
    benefits: [
      'Learn from professional choreographers and performers',
      'Live feedback on your movements and performance',
      'Small batch sizes for personalized attention',
      'Flexible schedules for all skill levels',
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
    seoTitle: 'Learn Music Online | Live Singing & Instrument Classes',
    seoDescription: 'Learn music online with live classes from professional musicians. Master singing, guitar, piano, music production, and songwriting through interactive sessions. Join expert-led music workshops today.',
    keywords: ['learn music online', 'online music classes', 'live singing lessons', 'guitar classes online', 'piano lessons online', 'music production courses', 'songwriting workshops'],
    benefits: [
      'Learn from professional musicians and vocalists',
      'Live practice sessions with instant feedback',
      'Master instruments or improve your vocals',
      'Flexible timings for working professionals',
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
    seoTitle: 'Online Design Classes | Graphic Design & Creative Workshops',
    seoDescription: 'Join online design classes with live instruction. Learn graphic design, Photoshop, Canva, animation, and video editing from industry experts. Interactive design workshops with project-based learning.',
    keywords: ['online design classes', 'graphic design courses', 'photoshop classes online', 'canva workshops', 'video editing courses', 'animation classes', 'creative design workshops'],
    benefits: [
      'Learn from designers at top companies',
      'Hands-on projects with live feedback',
      'Master industry-standard tools',
      'Build your design portfolio',
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


    seoTitle: 'Content Creator Classes | YouTube & Social Media Workshops',
    seoDescription: 'Learn content creation skills with live workshops. Master YouTube strategy, social media growth, reels creation, and personal branding from successful creators. Build your online presence today.',
    keywords: ['content creator courses', 'youtube classes online', 'social media workshops', 'personal branding classes', 'reels creation course', 'influencer marketing training'],
    benefits: [
      'Learn from successful content creators',
      'Grow your audience with proven strategies',
      'Create viral content consistently',
      'Monetize your creative skills',
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
    seoTitle: 'Public Speaking Classes | Communication Skills Workshops Online',
    seoDescription: 'Improve your communication skills with live classes. Learn public speaking, spoken English, interview preparation, and personality development from expert trainers through interactive sessions.',
    keywords: ['public speaking classes', 'communication skills training', 'spoken english courses', 'interview preparation online', 'presentation skills workshops', 'confidence building classes'],
    benefits: [
      'Speak confidently in any situation',
      'Ace interviews and presentations',
      'Improve English fluency',
      'Develop executive presence',
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
    seoTitle: 'Online Yoga & Wellness Classes | Live Fitness Workshops',
    seoDescription: 'Join live wellness classes from certified instructors. Learn yoga, meditation, fitness, nutrition, and mental wellness through interactive online sessions. Transform your lifestyle today.',
    keywords: ['online yoga classes', 'wellness workshops', 'fitness classes online', 'meditation courses', 'nutrition coaching online', 'mental wellness training'],
    benefits: [
      'Train with certified wellness experts',
      'Flexible schedules for busy lifestyles',
      'Personalized wellness guidance',
      'Achieve work-life balance',
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
    seoTitle: 'Tech Workshops Live | Learn Coding & Digital Skills Online',
    seoDescription: 'Join live tech workshops and learn digital skills from industry professionals. Master AI tools, coding, web development, no-code platforms, and app building through interactive online classes.',
    keywords: ['tech workshops live', 'online coding classes', 'learn programming online', 'web development courses', 'AI tools training', 'no-code workshops', 'digital skills courses'],
    benefits: [
      'Learn from tech professionals at leading companies',
      'Live coding sessions with real-time support',
      'Build projects while you learn',
      'Stay updated with latest tech trends',
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
    seoTitle: 'Art & Craft Classes Online | DIY Workshops Live',
    seoDescription: 'Join live art and craft classes. Learn painting, calligraphy, resin art, handmade jewelry, and DIY projects from skilled artists. Interactive workshops for creative expression.',
    keywords: ['online art classes', 'craft workshops', 'painting classes online', 'calligraphy courses', 'resin art training', 'diy workshops', 'handmade jewelry classes'],
    benefits: [
      'Learn from experienced artists',
      'Create beautiful handmade pieces',
      'Start your own craft business',
      'Express your creativity',
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
    seoTitle: 'Online Cooking Classes | Culinary Arts Workshops Live',
    seoDescription: 'Master cooking with live culinary classes. Learn baking, regional cuisines, healthy recipes, coffee art, and mixology from professional chefs through interactive cooking sessions.',
    keywords: ['online cooking classes', 'baking courses online', 'culinary workshops', 'cooking lessons live', 'chef training online', 'healthy cooking classes'],
    benefits: [
      'Learn from professional chefs',
      'Master diverse cuisines',
      'Cook healthy, delicious meals',
      'Perfect for home cooks',
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
    seoTitle: 'Fashion Styling & Beauty Classes Online | Makeup Workshops',
    seoDescription: 'Learn fashion styling, makeup, skincare, and beauty skills with live classes. Master wardrobe building, grooming, and personal style from industry experts.',
    keywords: ['fashion styling classes', 'makeup courses online', 'beauty workshops', 'personal styling training', 'skincare classes', 'wardrobe styling courses'],
    benefits: [
      'Learn from fashion professionals',
      'Develop your personal style',
      'Master makeup techniques',
      'Build a versatile wardrobe',
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
    seoTitle: 'Freelancing & Career Development Courses | Business Workshops',
    seoDescription: 'Advance your career with live business and freelancing workshops. Learn Upwork, Fiverr, LinkedIn optimization, resume building, and entrepreneurship from successful professionals.',
    keywords: ['freelancing courses', 'career development workshops', 'upwork training', 'fiverr classes', 'linkedin optimization', 'resume building courses', 'entrepreneurship classes'],
    benefits: [
      'Launch your freelance career',
      'Land better job opportunities',
      'Build professional networks',
      'Achieve financial independence',
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
    seoTitle: 'Online Language Classes | Learn Languages Live',
    seoDescription: 'Learn languages online with native speakers. Master English, Spanish, French, or Hindi through interactive live classes. Conversational practice with cultural insights.',
    keywords: ['online language classes', 'learn english online', 'spanish classes', 'french courses', 'language learning workshops', 'conversational language training'],
    benefits: [
      'Learn from native speakers',
      'Conversational practice',
      'Cultural immersion',
      'Flexible learning schedules',
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
    seoTitle: 'Gaming & Esports Classes | Streaming Workshops Online',
    seoDescription: 'Level up your gaming career with live esports classes. Learn game streaming, content creation for gamers, and esports skills from professional gamers and streamers.',
    keywords: ['gaming classes online', 'esports training', 'streaming workshops', 'gaming content creation', 'twitch streaming courses', 'professional gaming classes'],
    benefits: [
      'Learn from professional gamers',
      'Build streaming audience',
      'Monetize gaming skills',
      'Join the esports community',
    ],
  },
  {
    id: '14',
    slug: 'video-photography-filmmaking',
    title: 'Video, Photography & Filmmaking',
    subcategories: [
      'Mobile Photography',
      'Filmmaking for Beginners',
      'Color Grading / Editing',
    ],
    seoTitle: 'Photography & Filmmaking Classes Online | Video Editing Workshops',
    seoDescription: 'Master photography and filmmaking with live classes. Learn mobile photography, video editing, color grading, and filmmaking from industry professionals.',
    keywords: ['photography classes online', 'filmmaking courses', 'video editing workshops', 'mobile photography training', 'color grading classes', 'cinematography courses'],
    benefits: [
      'Learn from award-winning filmmakers',
      'Master camera techniques',
      'Edit professional videos',
      'Build your creative portfolio',
    ],
  },
];
