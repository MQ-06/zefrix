export interface Course {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  instructorImage: string;
  image: string;
  price: number;
  originalPrice: number;
  comparePrice?: number;
  sections: number;
  duration: number;
  students: number;
  category: string;
  categorySlug: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  backgroundColor: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  verified: boolean;
  courseTaken?: string;
}

export const categories: Category[] = [
  {
    id: '1',
    slug: 'design-creativity',
    name: 'Design & Creativity',
    icon: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85b_global-distribution.svg',
    backgroundColor: '#fadfca',
  },
  {
    id: '2',
    slug: 'music-singing',
    name: 'Music & Singing',
    icon: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85a_developing.svg',
    backgroundColor: '#ffefb0',
  },
  {
    id: '3',
    slug: 'tech-digital-skills',
    name: 'Tech & Digital Skills',
    icon: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b859_deal.svg',
    backgroundColor: '#c4dac8',
  },
  {
    id: '4',
    slug: 'wellness-lifestyle',
    name: 'Wellness & Lifestyle',
    icon: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b858_megaphone.svg',
    backgroundColor: '#e1e3f6',
  },
  {
    id: '5',
    slug: 'business-career-freelancing',
    name: 'Business, Career & Freelancing',
    icon: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b780_icon-5.svg',
    backgroundColor: '#ffbcbc',
  },
];

export const courses: Course[] = [
  {
    id: '1',
    slug: 'graphic-design-masterclass',
    title: 'Graphic Design Masterclass',
    instructor: 'Billy Vasquez',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b851_avatar-9.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b861_course-12.jpg',
    price: 450.00,
    originalPrice: 450.00,
    comparePrice: 530.00,
    sections: 140,
    duration: 90,
    students: 40,
    category: 'Business',
    categorySlug: 'business',
  },
  {
    id: '2',
    slug: 'sketch-from-a-to-z-for-app-designer',
    title: 'Sketch From A to Z: For App Designer',
    instructor: 'Dennis Barrett',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83a_avatar-3.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b860_course-11.jpg',
    price: 750.00,
    originalPrice: 750.00,
    comparePrice: 820.00,
    sections: 80,
    duration: 40,
    students: 10,
    category: 'Web development',
    categorySlug: 'web-development',
  },
  {
    id: '3',
    slug: 'the-complete-web-development-in-python',
    title: 'The Complete Web Development in Python',
    instructor: 'Jacqueline Miller',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b839_avatar-7.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85f_course-10.jpg',
    price: 450.00,
    originalPrice: 450.00,
    comparePrice: 520.00,
    sections: 100,
    duration: 50,
    students: 30,
    category: 'Web development',
    categorySlug: 'web-development',
  },
  {
    id: '4',
    slug: 'bootstrap-5-from-scratch',
    title: 'Bootstrap 5 From Scratch',
    instructor: 'Joan Wallace',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b84e_avatar-11.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85e_course-09.jpg',
    price: 230.00,
    originalPrice: 230.00,
    comparePrice: 360.00,
    sections: 150,
    duration: 5,
    students: 15,
    category: 'Web development',
    categorySlug: 'web-development',
  },
  {
    id: '5',
    slug: 'figma-to-webflow-full-course-webflow',
    title: 'Figma to Webflow: Full course',
    instructor: 'Judy Nguyen',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b850_avatar-2.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85d_course-08.jpg',
    price: 800.00,
    originalPrice: 800.00,
    comparePrice: 920.00,
    sections: 150,
    duration: 5,
    students: 15,
    category: 'Web development',
    categorySlug: 'web-development',
  },
  {
    id: '6',
    slug: 'build-websites-with-cms',
    title: 'Build Websites With CMS',
    instructor: 'Lori Stevens',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83b_avatar-6.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b862_course-07.jpg',
    price: 680.00,
    originalPrice: 680.00,
    comparePrice: 820.00,
    sections: 150,
    duration: 5,
    students: 15,
    category: 'Web development',
    categorySlug: 'web-development',
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Senior Graphic Designer',
    company: 'Ogilvy India',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b748_avatar-2.jpg',
    content: 'After completing the Advanced Figma batch, my design workflow improved by 60%. The instructor\'s real-world experience at Adobe was invaluable. I implemented the prototyping techniques in my client project the very next day and received amazing feedback.',
    rating: 5,
    verified: true,
    courseTaken: 'Advanced Figma Design',
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    role: 'Full Stack Developer',
    company: 'Infosys',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74f_avatar-3.jpg',
    content: 'The DevOps batch helped me land a promotion! The live sessions with a Google Cloud engineer gave me practical insights I couldn\'t find anywhere else. Completed 12 sessions and implemented CI/CD pipelines at work within 2 weeks.',
    rating: 5,
    verified: true,
    courseTaken: 'DevOps Fundamentals',
  },
  {
    id: '3',
    name: 'Sneha Patel',
    role: 'Product Manager',
    company: 'Swiggy',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b76a_avatar-9.jpg',
    content: 'Took the UI/UX Design Thinking batch and it transformed how I work with my design team. The instructor from Razorpay shared real case studies. The live Q&A sessions were incredibly valuable - got answers to specific challenges I was facing.',
    rating: 5,
    verified: true,
    courseTaken: 'UI/UX Design Thinking',
  },
  {
    id: '4',
    name: 'Arjun Kumar',
    role: 'Marketing Specialist',
    company: 'Zomato',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b781_avatar-11.jpg',
    content: 'The Digital Marketing Strategy batch was worth every penny. Learned growth hacking techniques from a senior marketer at CRED. Applied these strategies and saw a 40% increase in our campaign engagement rates. Best professional development investment!',
    rating: 5,
    verified: true,
    courseTaken: 'Digital Marketing Strategy',
  },
  {
    id: '5',
    name: 'Meera Desai',
    role: 'Content Strategist',
    company: 'Times Internet',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b766_avatar-7.jpg',
    content: 'Completed the Content Writing & SEO batch with an ex-Googler. The practical SEO techniques helped me rank 3 articles on page 1 within a month. The small batch size (only 8 students) meant personalized feedback on every piece I wrote.',
    rating: 5,
    verified: true,
    courseTaken: 'Content Writing & SEO',
  },
  {
    id: '6',
    name: 'Vikram Singh',
    role: 'Startup Founder',
    company: 'TechVenture Labs',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b767_avatar-5.jpg',
    content: 'As a founder, time is precious. The Python for Data Analysis batch fit perfectly into my schedule - 5 sessions over 1 week. The instructor from Microsoft broke down complex concepts beautifully. Now I can analyze our metrics independently!',
    rating: 5,
    verified: true,
    courseTaken: 'Python for Data Analysis',
  },
];

export const faqs = [
  {
    id: '1',
    question: 'What is Zefrix and how does it work?',
    answer: 'Zefrix is a live skill-sharing platform where creators host interactive sessions and students can join instantly. Unlike traditional edtech platforms, Zefrix focuses on casual, fun, and creator led learning experiences. Students can browse batches by category, pay securely through Razorpay, and join live sessions via Google Meet. Creators can host both one-time batches and multi-session batches, with automated confirmations and reminders sent to all participants.',
  },
  {
    id: '2',
    question: 'How do I join a batch or session on Zefrix?',
    answer: 'To join a batch or session, first create an account or log in. Browse available batches by category or creator, view batch details including schedule, price, and instructor information. Once you find a batch you like, click to enroll and complete payment through our secure Razorpay integration. After payment, you\'ll receive a confirmation email with the Google Meet link and batch schedule. You can also add sessions to your Google Calendar for automatic reminders.',
  },
  
  {
    id: '5',
    question: 'How do I become a creator on Zefrix?',
    answer: 'To become a creator, click on "Become a Creator" from the homepage and complete the registration process. You can create your profile, add your bio, expertise areas, and social handles. You can then create batches or sessions by selecting a category, adding a subcategory, setting the schedule, price, and maximum Members. All batches require admin approval before going live to ensure quality standards.',
  },

];

