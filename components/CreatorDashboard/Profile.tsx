'use client';

export default function CreatorProfile() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  return (
    <div className="creator-profile">
      <form onSubmit={handleSubmit} className="creator-form">
        <div className="creator-form-group">
          <label htmlFor="profile-name" className="creator-field-label">Name</label>
          <input
            type="text"
            id="profile-name"
            name="name"
            className="creator-form-input"
            required
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-bio" className="creator-field-label">Bio</label>
          <textarea
            id="profile-bio"
            name="bio"
            className="creator-form-input creator-textarea"
            rows={4}
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-skills" className="creator-field-label">Skills / Tags</label>
          <input
            type="text"
            id="profile-skills"
            name="skills"
            className="creator-form-input"
            placeholder="e.g., Graphic Design, Web Development"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-phone" className="creator-field-label">Phone Number</label>
          <input
            type="tel"
            id="profile-phone"
            name="phone"
            className="creator-form-input"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-image" className="creator-field-label">Profile Image</label>
          <input
            type="url"
            id="profile-image"
            name="profileImage"
            className="creator-form-input"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <button type="submit" className="creator-submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
}

