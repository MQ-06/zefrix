# Zefrix Clone - Live Skill Sharing Platform

A modern, production-ready Next.js clone of the Zefrix live skill-sharing platform. Built with React, TypeScript, Tailwind CSS, and Framer Motion for smooth animations.

## Features

- 🎨 **Modern UI/UX**: Beautiful, responsive design matching the original Zefrix platform
- 🚀 **Performance**: Built with Next.js 14 for optimal performance and SEO
- ✨ **Animations**: Smooth animations using Framer Motion
- 📱 **Responsive**: Fully responsive design for all devices
- 🎯 **Type-Safe**: Built with TypeScript for better developer experience
- 🔍 **Filtering**: Advanced course filtering on the courses page
- 🎬 **Interactive Components**: Testimonials slider, FAQ accordion, video player

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zefrix-clone
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
zefrix-clone/
├── app/
│   ├── courses/          # Courses listing page with filters
│   ├── product/[slug]/   # Individual course detail page
│   ├── category/[slug]/  # Category page
│   ├── signup-login/     # Authentication page
│   ├── user-pages/       # User-related pages
│   ├── layout.tsx        # Root layout with Header/Footer
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── Header.tsx        # Navigation header
│   ├── Footer.tsx        # Footer component
│   ├── HeroSection.tsx   # Hero section
│   ├── CategorySection.tsx
│   ├── CoursesSection.tsx
│   ├── CourseCard.tsx
│   ├── TestimonialsSection.tsx
│   ├── FAQSection.tsx
│   ├── VideoSection.tsx
│   ├── StatsSection.tsx
│   ├── HowItWorksSection.tsx
│   └── ClientLogosSection.tsx
├── lib/
│   └── data.ts           # Mock data for courses, categories, etc.
└── public/               # Static assets
```

## Pages

- **Home (`/`)**: Hero section, categories, courses, testimonials, FAQ, and more
- **Courses (`/courses`)**: All courses with filtering options
- **Product Detail (`/product/[slug]`)**: Individual course details
- **Category (`/category/[slug]`)**: Courses by category
- **Sign Up/Login (`/signup-login`)**: Authentication page
- **Become a Creator (`/user-pages/become-a-creator`)**: Creator onboarding page

## Components

All components are reusable and follow React best practices:
- Type-safe with TypeScript
- Responsive design
- Smooth animations
- Accessible markup

## Styling

The project uses Tailwind CSS with custom configuration:
- Custom color palette matching Zefrix brand
- Responsive utilities
- Custom gradients and animations

## Building for Production

```bash
npm run build
npm start
```

## License

This project is a clone/replication for educational purposes.

## Notes

- Images are loaded from the original Zefrix CDN
- Mock data is provided in `lib/data.ts`
- All routes are functional and ready for backend integration

