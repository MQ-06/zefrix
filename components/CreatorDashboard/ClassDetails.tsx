'use client';

import styles from './ClassDetails.module.css';

interface Student {
  id: string;
  name: string;
  email: string;
}

const mockStudents: Student[] = [
  { id: '1', name: 'John Doe', email: 'Smartphone' },
];

export default function ClassDetails() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Class Details</h2>
      </div>

      <div className={styles.grid}>
        {/* Left Card - Class Info */}
        <div className={styles.classInfoCard}>
          <h3 className={styles.classTitle}>Title</h3>
          <p className={styles.classDescription}>Description</p>

          <div className={styles.chartWrapper}>
            <img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/69261648e70d8247933ca698_product-categories-graph-dashdark-webflow-template.svg"
              alt="Sales Chart"
              className={styles.chartImage}
            />
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Price</div>
              <div className={styles.infoValue}>$153,143.00</div>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Level</div>
              <div className={styles.infoValue}>Level 1</div>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Category</div>
              <div className={styles.infoValue}>Upper Category</div>
            </div>
          </div>
        </div>

        {/* Right Card - Students */}
        <div className={styles.studentsCard}>
          <div className={styles.studentsHeader}>
            <h3 className={styles.studentsTitle}>Students</h3>
            <button className={styles.addButton}>Add Student</button>
          </div>

          <div className={styles.tableHeader}>
            <div className={styles.tableCol}>Name</div>
            <div className={styles.tableCol}>Email</div>
          </div>

          {mockStudents.map((student) => (
            <div key={student.id} className={styles.tableRow}>
              <div className={styles.tableCol}>{student.name}</div>
              <div className={styles.tableCol}>{student.email}</div>
            </div>
          ))}

          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input type="text" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Bio</label>
              <input type="text" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Skills / Tags</label>
              <input type="text" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input type="tel" className={styles.input} />
            </div>
            <button type="submit" className={styles.addButton}>
              Add Student
            </button>
          </form>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionButton}>Start Class</button>
        <button className={styles.actionButton}>Edit Class</button>
        <button className={styles.actionButton}>Upload Recording</button>
      </div>
    </div>
  );
}

