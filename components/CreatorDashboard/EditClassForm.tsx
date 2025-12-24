'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

import { uploadImage, getClassThumbnailPath, validateFile } from '@/lib/utils/serverStorage';

declare global {
    interface Window {
        firebaseAuth: any;
        firebaseDb: any;
        doc: any;
        getDoc: any;
        updateDoc: any;
    }
}

interface EditClassFormProps {
    classId: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function EditClassForm({ classId, onCancel, onSuccess }: EditClassFormProps) {
    const { showSuccess, showError } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [classData, setClassData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Thumbnail upload state
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    useEffect(() => {
        fetchClassData();
    }, [classId]);

    const fetchClassData = async () => {
        try {
            // Wait for Firebase
            let retries = 0;
            while ((!window.firebaseDb || !window.doc || !window.getDoc) && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }

            if (!window.firebaseDb || !window.doc || !window.getDoc) {
                throw new Error('Firebase not ready');
            }

            const classRef = window.doc(window.firebaseDb, 'classes', classId);
            const classSnap = await window.getDoc(classRef);

            if (classSnap.exists()) {
                const data = classSnap.data();
                setClassData(data);
                // Set existing thumbnail URL as preview
                if (data.videoLink) {
                    setThumbnailPreview(data.videoLink);
                }
            } else {
                throw new Error('Class not found');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load class data');
        } finally {
            setLoading(false);
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        const validation = validateFile(file, 'image');
        if (!validation.valid) {
            showError(validation.error || 'Invalid file');
            return;
        }

        setThumbnailFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setThumbnailPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (!window.firebaseDb || !window.doc || !window.updateDoc) {
                throw new Error('Firebase not ready');
            }

            const form = e.currentTarget;
            const formData = new FormData(form);

            // Upload thumbnail to server storage if file was selected
            let finalVideoLink = formData.get('videoLink') as string;
            if (thumbnailFile) {
                try {
                    setUploadingThumbnail(true);
                    const path = getClassThumbnailPath(classId, thumbnailFile.name);
                    finalVideoLink = await uploadImage(thumbnailFile, path, true);
                    console.log('✅ Thumbnail uploaded to server storage:', finalVideoLink);
                } catch (uploadError: any) {
                    console.error('Thumbnail upload error:', uploadError);
                    showError(`Thumbnail upload failed: ${uploadError.message}. Continuing with class update...`);
                    // Continue with update even if thumbnail upload fails
                } finally {
                    setUploadingThumbnail(false);
                }
            }

            const updatedData: any = {
                title: formData.get('title') as string,
                subtitle: formData.get('subtitle') as string,
                description: formData.get('description') as string,
                price: parseFloat(formData.get('price') as string),
                videoLink: finalVideoLink,
                updatedAt: new Date(),
            };

            // Only include maxSeats if it has a value
            const maxSeatsInput = formData.get('maxSeats') as string;
            if (maxSeatsInput && maxSeatsInput.trim() && parseInt(maxSeatsInput.trim()) > 0) {
                updatedData.maxSeats = parseInt(maxSeatsInput.trim());
            }

            const classRef = window.doc(window.firebaseDb, 'classes', classId);
            await window.updateDoc(classRef, updatedData);

            showSuccess('Class updated successfully!');
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update class');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
                Loading class data...
            </div>
        );
    }

    if (error && !classData) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#F44336' }}>
                {error}
                <br />
                <button onClick={onCancel} style={{ marginTop: '1rem' }}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>Edit Class</h2>
                <button
                    onClick={onCancel}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit} className="creator-form">
                <div className="creator-form-group">
                    <label htmlFor="title" className="creator-field-label">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="creator-form-input"
                        defaultValue={classData?.title}
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
                        defaultValue={classData?.subtitle}
                        required
                    />
                </div>

                <div className="creator-form-group">
                    <label htmlFor="description" className="creator-field-label">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="creator-form-input creator-textarea"
                        rows={4}
                        defaultValue={classData?.description}
                        required
                    />
                </div>

                <div className="creator-form-group">
                    <label htmlFor="price" className="creator-field-label">Price (INR)</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        className="creator-form-input"
                        min="0"
                        step="0.01"
                        defaultValue={classData?.price}
                        required
                    />
                </div>

                <div className="creator-form-group">
                    <label htmlFor="thumbnail" className="creator-field-label">Thumbnail Image</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="file"
                                id="thumbnail"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                onChange={handleThumbnailChange}
                                disabled={uploadingThumbnail || saving}
                                style={{ 
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    cursor: (uploadingThumbnail || saving) ? 'not-allowed' : 'pointer'
                                }}
                            />
                            <small style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginTop: '0.5rem' }}>
                                Max size: 5MB. Formats: JPEG, PNG, WebP, GIF.
                            </small>
                            {uploadingThumbnail && (
                                <div style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                                    ⏳ Uploading thumbnail...
                                </div>
                            )}
                        </div>
                        {(thumbnailPreview || classData?.videoLink) && (
                            <div style={{ 
                                width: '150px', 
                                height: '100px', 
                                borderRadius: '8px', 
                                overflow: 'hidden',
                                border: '2px solid rgba(217, 42, 99, 0.5)',
                                flexShrink: 0
                            }}>
                                <img
                                    src={thumbnailPreview || classData?.videoLink}
                                    alt="Thumbnail preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>
                    <small style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginTop: '0.5rem' }}>
                        Upload a thumbnail image for your class. Or use the video link field below to set a video URL (YouTube, etc.) as the thumbnail.
                    </small>
                </div>

                <div className="creator-form-group">
                    <label htmlFor="videoLink" className="creator-field-label">Video/Image Link (Optional)</label>
                    <input
                        type="url"
                        id="videoLink"
                        name="videoLink"
                        className="creator-form-input"
                        defaultValue={classData?.videoLink}
                        placeholder="https://... (thumbnail image URL or video URL)"
                        disabled={!!thumbnailFile}
                    />
                    <small style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginTop: '0.5rem' }}>
                        {thumbnailFile ? 'Uploaded thumbnail will override this field.' : 'If you don\'t upload a thumbnail above, you can provide an image or video URL here.'}
                    </small>
                </div>

                <div className="creator-form-group">
                    <label htmlFor="maxSeats" className="creator-field-label">Max Seats (Optional)</label>
                    <input
                        type="number"
                        id="maxSeats"
                        name="maxSeats"
                        className="creator-form-input"
                        min="1"
                        defaultValue={classData?.maxSeats}
                    />
                </div>

                <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 152, 0, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    marginBottom: '1rem'
                }}>
                    <p style={{ color: '#FF9800', fontSize: '0.875rem', margin: 0 }}>
                        ℹ️ Note: Category, schedule, and other core details cannot be edited. If you need to change these, please delete this class and create a new one.
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        type="submit"
                        className="creator-submit-btn"
                        disabled={saving}
                        style={{
                            opacity: saving ? 0.6 : 1,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            flex: 1
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: 'transparent',
                            border: '2px solid #D92A63',
                            color: '#fff',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            flex: 1
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
