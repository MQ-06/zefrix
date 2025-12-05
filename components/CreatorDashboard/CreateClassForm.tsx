'use client';

import { useState, useEffect } from 'react';

const categories = [
  'Dance & Performing Arts',
  'Music & Singing',
  'Design & Creativity',
  'Content & Creator Skills',
  'Communication & Confidence',
  'Wellness & Lifestyle',
  'Tech & Digital Skills',
  'Cooking & Culinary Arts',
  'Fashion, Styling & Beauty',
  'Business, Career & Freelancing',
  'Language & Culture',
  'Gaming & Esports',
  'Video, Photography & Filmmaking',
];

const subCategories: Record<string, string[]> = {
  'Music & Singing': [
    'Singing (Western, Bollywood, Classical, Rap)',
    'Songwriting',
    'Music Production & Mixing',
    'Instrument Training (Guitar, Piano, Drums)',
  ],
  'Dance & Performing Arts': [
    'Dance (Hip-Hop, Contemporary, Bollywood, Freestyle)',
    'Acting / Theatre / Stage Presence',
    'Movement & Expression',
  ],
  'Design & Creativity': [
    'Drawing / Illustration',
    'Graphic Design / Canva / Photoshop',
    'Animation / Motion Graphics',
    'Video Editing / Reels Creation',
  ],
  'Content & Creator Skills': [
    'YouTube Strategy',
    'Social Media Growth',
    'Reels / Short-form Content',
    'Personal Branding',
  ],
  'Communication & Confidence': [
    'Public Speaking',
    'Spoken English',
    'Interview Skills',
    'Presentation & Personality Development',
  ],
  'Wellness & Lifestyle': [
    'Yoga / Meditation',
    'Fitness / Home Workouts',
    'Nutrition',
    'Mental Wellness / Productivity',
  ],
  'Tech & Digital Skills': [
    'AI Tools (ChatGPT, Midjourney, Runway, Notion)',
    'Web Design / Coding Basics',
    'No-Code Tools (Bubble, Framer)',
    'App & Website Building',
  ],
  'Cooking & Culinary Arts': [
    'Home Cooking / Baking',
    'Coffee Art / Mixology',
    'Regional Cuisines / Street Food / Healthy Recipes',
  ],
  'Fashion, Styling & Beauty': [
    'Fashion Styling',
    'Makeup / Skincare / Grooming',
    'Outfit Aesthetics / Capsule Wardrobe',
    'Haircare & Personal Care',
  ],
  'Business, Career & Freelancing': [
    'Freelancing / Fiverr / Upwork',
    'Resume & LinkedIn Building',
    'Career Clarity / Productivity',
    'Entrepreneurship for Creators',
  ],
  'Language & Culture': [
    'English Communication',
    'Spanish / French / Hindi for Foreigners',
    'Cultural Exchange / Travel Learning',
  ],
  'Gaming & Esports': [
    'Game Streaming / Esports Skills',
    'Content Creation for Gamers',
  ],
  'Video, Photography & Filmmaking': [
    'Photography Basics / Smartphone Photography',
    'Videography / Cinematography',
    'Video Editing (Premiere Pro, DaVinci Resolve)',
  ],
};

export default function CreateClassForm() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scheduleType, setScheduleType] = useState('one-time');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission
    alert('Class creation form submitted!');
  };

  return (
    <form onSubmit={handleSubmit} className="creator-form">
      <h5 className="creator-form-heading">Class Information Fields</h5>
      
      <div className="creator-form-group">
        <label htmlFor="title" className="creator-field-label">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          className="creator-form-input"
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="subtitle" className="creator-field-label">Subtitle</label>
        <input
          type="text"
          id="subtitle"
          name="subtitle"
          className="creator-form-input"
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="category" className="creator-field-label">Category</label>
        <select
          id="category"
          name="category"
          className="creator-form-input creator-select"
          value={selectedCategory}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && subCategories[selectedCategory] && (
        <div className="creator-form-group">
          <label htmlFor="subcategory" className="creator-field-label">Sub Category</label>
          <select
            id="subcategory"
            name="subcategory"
            className="creator-form-input creator-select"
            required
          >
            <option value="">Select a subcategory</option>
            {subCategories[selectedCategory].map((subcat) => (
              <option key={subcat} value={subcat}>
                {subcat}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="creator-form-group">
        <label htmlFor="description" className="creator-field-label">Description</label>
        <textarea
          id="description"
          name="description"
          className="creator-form-input creator-textarea"
          rows={4}
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="learn" className="creator-field-label">What Students Will Learn</label>
        <textarea
          id="learn"
          name="learn"
          className="creator-form-input creator-textarea"
          rows={4}
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="level" className="creator-field-label">Level</label>
        <input
          type="text"
          id="level"
          name="level"
          className="creator-form-input"
          placeholder="e.g., Beginner, Intermediate, Advanced"
          required
        />
      </div>

      <h5 className="creator-form-heading">Media</h5>
      <div className="creator-form-group">
        <label htmlFor="video-link" className="creator-field-label">Video Link</label>
        <input
          type="url"
          id="video-link"
          name="videoLink"
          className="creator-form-input"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <h5 className="creator-form-heading">Pricing</h5>
      <div className="creator-form-group">
        <label htmlFor="price" className="creator-field-label">Price (INR)</label>
        <input
          type="number"
          id="price"
          name="price"
          className="creator-form-input"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="creator-form-group">
        <label htmlFor="max-seats" className="creator-field-label">Max Seats (Optional)</label>
        <input
          type="number"
          id="max-seats"
          name="maxSeats"
          className="creator-form-input"
          min="1"
        />
      </div>

      <h5 className="creator-form-heading">Schedule Type</h5>
      <div className="creator-radio-group">
        <label className="creator-radio-wrap">
          <input
            type="radio"
            name="scheduleType"
            value="one-time"
            checked={scheduleType === 'one-time'}
            onChange={(e) => setScheduleType(e.target.value)}
            className="creator-radio-input"
          />
          <span className="creator-radio-label">One-time Session</span>
        </label>
        <label className="creator-radio-wrap">
          <input
            type="radio"
            name="scheduleType"
            value="recurring"
            checked={scheduleType === 'recurring'}
            onChange={(e) => setScheduleType(e.target.value)}
            className="creator-radio-input"
          />
          <span className="creator-radio-label">Recurring Batch</span>
        </label>
      </div>

      {scheduleType === 'one-time' && (
        <div className="creator-one-time-fields">
          <div className="creator-form-group">
            <label htmlFor="date" className="creator-field-label">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="start-time" className="creator-field-label">Start Time</label>
            <input
              type="time"
              id="start-time"
              name="startTime"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="end-time" className="creator-field-label">End Time</label>
            <input
              type="time"
              id="end-time"
              name="endTime"
              className="creator-form-input"
              required
            />
          </div>
        </div>
      )}

      {scheduleType === 'recurring' && (
        <div className="creator-recurring-fields">
          <div className="creator-form-group">
            <label className="creator-field-label">Days</label>
            <div className="creator-pill-wrap">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="creator-pill-item">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="creator-pill-checkbox"
                  />
                  <span className="creator-pill-label">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="creator-form-group">
            <label htmlFor="start-date" className="creator-field-label">Start Date</label>
            <input
              type="date"
              id="start-date"
              name="startDate"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="end-date" className="creator-field-label">End Date</label>
            <input
              type="date"
              id="end-date"
              name="endDate"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="recurring-start-time" className="creator-field-label">Start Time</label>
            <input
              type="time"
              id="recurring-start-time"
              name="recurringStartTime"
              className="creator-form-input"
              required
            />
          </div>
          <div className="creator-form-group">
            <label htmlFor="recurring-end-time" className="creator-field-label">End Time</label>
            <input
              type="time"
              id="recurring-end-time"
              name="recurringEndTime"
              className="creator-form-input"
              required
            />
          </div>
        </div>
      )}

      <button type="submit" className="creator-submit-btn">
        Submit for Approval
      </button>
    </form>
  );
}

