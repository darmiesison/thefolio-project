// frontend/src/pages/CreatePostPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fd = new FormData();
    // CRITICAL FIX: Append the title to FormData
    fd.append('title', title); 
    fd.append('body', body);
    
    if (image) {
      fd.append('image', image);
    }

    try {
      // Ensure the 'Content-Type' is set correctly for multi-part data
      const { data } = await API.post('/posts', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/posts/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    }
  };

  return (
    <div className='create-post-page'>
      <h2>Write a New Post</h2>
      {error && <p className='error-msg'>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Post title'
          required
        />
        
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='Write your post here...'
          rows={12}
          required
        />

        {user?.role === 'admin' && (
          <div className="file-upload-section">
            <label>Upload Cover Image (Admin only):</label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>
        )}

        <button type='submit'>Publish Post</button>
      </form>
    </div>
  );
};

export default CreatePostPage;