'use client';

const mockStudents = [
  { id: '1', name: 'John Doe' },
];

export default function LiveClass() {
  return (
    <div className="creator-live-class">
      <div className="creator-live-grid">
        <div className="creator-live-students">
          <div className="creator-students-title">Students</div>
          <div className="creator-students-list">
            <div className="creator-table-header">
              <div className="creator-table-col">Name</div>
            </div>
            {mockStudents.map((student) => (
              <div key={student.id} className="creator-student-item">
                {student.name}
              </div>
            ))}
          </div>
        </div>

        <div className="creator-live-video">
          <div className="creator-video-wrapper">
            <div className="creator-video-container">
              <iframe
                className="creator-video-iframe"
                src="https://www.youtube.com/embed/xPZ5FOesvAI"
                title="Live Class Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
      <div className="creator-live-actions">
        <button className="creator-action-btn creator-batch-btn">Join Class</button>
        <button className="creator-action-btn creator-batch-btn">End Class</button>
      </div>
    </div>
  );
}

