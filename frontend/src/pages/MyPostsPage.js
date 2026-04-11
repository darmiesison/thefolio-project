import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

function MyPostsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchMyPosts();
  }, [user]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await API.get("/posts/my-posts");
      setPosts(response.data);
    } catch (err) {
      console.error("Unable to load your posts.");
      setStatusMessage("Unable to load your posts right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account and all your posts, likes, and comments?")) return;

    try {
      await API.delete("/auth/delete");
      logout();
      navigate("/login");
    } catch (err) {
      console.error("Account delete failed", err.response?.data || err.message);
      setStatusMessage("Unable to delete account. Please try again.");
    }
  };

  return (
    <main className="my-posts-page">
      <div className="page-header-row">
        <h2>My Posts</h2>
        <div className="header-actions">
          <button type="button" className="delete-account-button" onClick={handleDeleteAccount}>
            Delete Account
          </button>
          <Link to="/cat" className="back-link">← Back to Cat Page</Link>
        </div>
      </div>
      {loading && <p>Loading your posts...</p>}
      {statusMessage && <div className="success">{statusMessage}</div>}
      {!loading && posts.length === 0 && (
        <div className="empty-state card">
          <h3>No posts yet</h3>
          <p>You haven't created any posts. <Link to="/cat">Create your first post</Link></p>
        </div>
      )}
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-list-item card">
            <Link to={`/post/${post.id}`} className="post-link">
              <div className="post-preview">
                <p className="post-date">{new Date(post.created_at).toLocaleString()}</p>
                <p className="post-content-preview">
                  {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                </p>
                {post.image_url && <img src={post.image_url} alt="Post" className="post-image-thumb" />}
                <div className="post-stats">
                  <span>{post.likes} likes</span>
                  <span>{post.comments_count} comments</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

export default MyPostsPage;