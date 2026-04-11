// frontend/src/pages/HomePage.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/posts')
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Error fetching posts:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader">Loading posts...</div>;

  return (
    <div className='home-page'>
      <h2>Latest Posts</h2>
      
      {posts.length === 0 && (
        <p>No posts yet. Be the first to write one!</p>
      )}

      <div className='posts-grid'>
        {posts.map((post) => (
          <div key={post._id} className='post-card'>
            {post.image && (
              <img 
                src={`http://localhost:5000/uploads/${post.image}`} 
                alt={post.title} 
              />
            )}
            
            <h3>
              <Link to={`/posts/${post._id}`}>{post.title}</Link>
            </h3>
            <p>{post.body?.substring(0, 120)}...</p>

            <small>
              By {post.author?.name || 'Anonymous'} · {new Date(post.createdAt).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;