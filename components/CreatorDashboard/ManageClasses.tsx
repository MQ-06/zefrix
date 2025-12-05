'use client';

import styles from './ManageClasses.module.css';

interface ClassItem {
  id: string;
  title: string;
  status: string;
  thumbnail: string;
  studentCount: number;
}

const mockClasses: ClassItem[] = [
  {
    id: '1',
    title: 'Title',
    status: 'Status',
    thumbnail: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg',
    studentCount: 1
  },
  {
    id: '2',
    title: 'Title',
    status: 'Status',
    thumbnail: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg',
    studentCount: 1
  },
  {
    id: '3',
    title: 'Title',
    status: 'Status',
    thumbnail: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg',
    studentCount: 1
  },
  {
    id: '4',
    title: 'Title',
    status: 'Status',
    thumbnail: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg',
    studentCount: 1
  },
];

export default function ManageClasses() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage Classes</h2>
      </div>
      <div className={styles.classList}>
        {mockClasses.map((classItem) => (
          <div key={classItem.id} className={styles.classItem}>
            <div className={styles.classGrid}>
              <img
                src={classItem.thumbnail}
                alt={classItem.title}
                className={styles.thumbnail}
              />
              <h3 className={styles.classTitle}>{classItem.title}</h3>
              <h3 className={styles.classStatus}>{classItem.status}</h3>
              <div className={styles.classCount}>{classItem.studentCount}</div>
              <button className={styles.button}>Edit Class</button>
              <button className={styles.button}>View Class</button>
              <button className={styles.button}>Manage Batches</button>
              <button className={styles.button}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

