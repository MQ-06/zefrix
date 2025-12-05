'use client';

import styles from './ManageBatches.module.css';

interface BatchItem {
  id: string;
  dateTime: string;
  status: string;
}

const mockBatches: BatchItem[] = [
  { id: '1', dateTime: 'Date/Time', status: 'Status' },
  { id: '2', dateTime: 'Date/Time', status: 'Status' },
  { id: '3', dateTime: 'Date/Time', status: 'Status' },
  { id: '4', dateTime: 'Date/Time', status: 'Status' },
];

export default function ManageBatches() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage Batches</h2>
      </div>
      <div className={styles.batchList}>
        {mockBatches.map((batch) => (
          <div key={batch.id} className={styles.batchItem}>
            <div className={styles.batchGrid}>
              <div className={styles.batchDateTime}>{batch.dateTime}</div>
              <div className={styles.batchStatus}>{batch.status}</div>
              <button className={styles.button}>Edit Batch</button>
              <button className={styles.button}>Delete Batch</button>
            </div>
          </div>
        ))}
        <div className={styles.createSection}>
          <button className={styles.button}>Create Batch</button>
        </div>
      </div>
    </div>
  );
}

