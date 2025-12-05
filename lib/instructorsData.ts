export interface Instructor {
  id: string;
  slug: string;
  name: string;
  title: string;
  image: string;
}

export const instructors: Instructor[] = [
  {
    id: '1',
    slug: 'judy-nguyen',
    name: 'Judy Nguyen',
    title: 'Professor',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b850_avatar-2.jpg',
  },
  {
    id: '2',
    slug: 'samuel-bishop',
    name: 'Samuel Bishop',
    title: 'Associate professor',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b84f_avatar-4.jpg',
  },
  {
    id: '3',
    slug: 'joan-wallace',
    name: 'Joan Wallace',
    title: 'Assistant professor',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b84e_avatar-11.jpg',
  },
  {
    id: '4',
    slug: 'billy-vasquez',
    name: 'Billy Vasquez',
    title: 'Instructor',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b851_avatar-9.jpg',
  },
  {
    id: '5',
    slug: 'jacqueline-miller',
    name: 'Jacqueline Miller',
    title: 'Lecturer',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b839_avatar-7.jpg',
  },
  {
    id: '6',
    slug: 'louis-crawford',
    name: 'Louis Crawford',
    title: 'Academic professional',
    image: 'https://cdn.prod.website-files.com/658910431119417045c26cf5/658ba9b191a9e3f9f0544ea9_avatar-8.jpg',
  },
  {
    id: '7',
    slug: 'dennis-barrett',
    name: 'Dennis Barrett',
    title: 'Clinical',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83a_avatar-3.jpg',
  },
  {
    id: '8',
    slug: 'lori-stevens',
    name: 'Lori Stevens',
    title: 'Lecturer',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83b_avatar-6.jpg',
  },
];

