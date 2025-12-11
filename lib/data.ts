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
  avatar: string;
  content: string;
  rating: number;
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
    name: 'Judy Nguyen',
    role: 'Junior UI designer',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b748_avatar-2.jpg',
    content: 'To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Larry Lawson',
    role: 'Graduate Teacher',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74f_avatar-3.jpg',
    content: 'Obtain pain of itself, because it is pain, but because occasionally circumstances occur in which.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Billy Vasquez',
    role: 'Post Graduate Teacher',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b76a_avatar-9.jpg',
    content: 'Because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Carolyn Ortiz',
    role: 'Primary Teacher',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b781_avatar-11.jpg',
    content: 'Occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum.',
    rating: 5,
  },
  {
    id: '5',
    name: 'Judy Nguyen',
    role: 'Founder',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b766_avatar-7.jpg',
    content: 'Normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English.',
    rating: 5,
  },
  {
    id: '6',
    name: 'Frances Guerrero',
    role: 'CEO',
    avatar: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b767_avatar-5.jpg',
    content: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
    rating: 5,
  },
];

export const faqs = [
  {
    id: '1',
    question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ac neque nec dui tincidunt gravida. Suspendisse potenti. Integer vitae pretium nunc. Nullam euismod, urna at facilisis vulputate, sapien orci fermentum tortor, non hendrerit sapien risus et urna. Mauris dignissim pellentesque felis, vel commodo lorem dapibus sit amet.',
  },
  {
    id: '2',
    question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ac neque nec dui tincidunt gravida. Suspendisse potenti. Integer vitae pretium nunc. Nullam euismod, urna at facilisis vulputate, sapien orci fermentum tortor, non hendrerit sapien risus et urna. Mauris dignissim pellentesque felis, vel commodo lorem dapibus sit amet.',
  },
  {
    id: '3',
    question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ac neque nec dui tincidunt gravida. Suspendisse potenti. Integer vitae pretium nunc. Nullam euismod, urna at facilisis vulputate, sapien orci fermentum tortor, non hendrerit sapien risus et urna. Mauris dignissim pellentesque felis, vel commodo lorem dapibus sit amet.',
  },
];

