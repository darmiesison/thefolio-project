import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ProfilePage = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editForm, setEditForm] = useState({
    gender: user?.gender || '',
    interestLevel: user?.interestLevel || ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesCount: 0,
    commentsCount: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('profilePic', file);

    try {
      const response = await API.put('/auth/profile', uploadFormData);
      updateUser(response.data);
      setStatusMessage('Profile picture updated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setStatusMessage('Failed to update profile picture.');
    }
  };

  // Fetch latest user data when component mounts and user exists
  useEffect(() => {
    if (user) {
      refreshUser();
      setEditForm({
        gender: user?.gender || '',
        interestLevel: user?.interestLevel || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const postsRes = await API.get('/posts/my-posts');
        const posts = postsRes.data;
        
        const postsCount = posts.length;
        const likesCount = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
        const commentsCount = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        
        setStats({
          postsCount,
          likesCount,
          commentsCount
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      const updateData = new FormData();
      if (editForm.gender) updateData.append('gender', editForm.gender);
      if (editForm.interestLevel) updateData.append('interestLevel', editForm.interestLevel);

      const response = await API.put('/auth/profile', updateData);
      updateUser(response.data);
      setStatusMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setStatusMessage('Failed to update profile.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await API.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setSuccess('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {statusMessage && <p className="success-msg">{statusMessage}</p>}

      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {user?.profile_pic ? (
              <img src={user.profile_pic} alt={user?.name} />
            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-info-section">
            <h2>{user?.name}</h2>
            <p className="profile-description">
              Welcome to your community feed. Share posts, photos, likes, and comments with other cat lovers.
            </p>
            <div className="profile-buttons">
              <button className="btn-change" onClick={() => fileInputRef.current?.click()}>Update Profile</button>
              <button className="btn-view-posts" onClick={() => navigate('/my-posts')}>View My Posts</button>
              <button className="btn-change-password" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value">{stats.postsCount}</div>
          <div className="stat-label">My Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.likesCount}</div>
          <div className="stat-label">Post Likes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.commentsCount}</div>
          <div className="stat-label">Post Comments</div>
        </div>
      </div>

      <div className="profile-info">
        <h3>User Information</h3>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        
        {!isEditingProfile ? (
          <>
            {user?.gender && <p><strong>Gender:</strong> {user?.gender}</p>}
            {user?.interestLevel && <p><strong>Interest Level:</strong> {user?.interestLevel}</p>}
            <button className="btn-edit-profile" onClick={() => setIsEditingProfile(true)}>
              Edit Profile Info
            </button>
          </>
        ) : (
          <div className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                name="gender"
                value={editForm.gender}
                onChange={handleEditChange}
              >
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="interestLevel">Interest Level:</label>
              <select
                id="interestLevel"
                name="interestLevel"
                value={editForm.interestLevel}
                onChange={handleEditChange}
              >
                <option value="">Not specified</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <button className="btn-save" onClick={handleSaveProfile}>Save Changes</button>
            <button className="btn-cancel" onClick={() => setIsEditingProfile(false)}>Cancel</button>
          </div>
        )}
      </div>

      {showPasswordForm && (
        <div className="change-password-section">
          <h3>Change Password</h3>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password:</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;