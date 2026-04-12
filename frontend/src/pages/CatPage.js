import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

function CatPage() {
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await API.get("/posts");
      const loadedPosts = await Promise.all(
        response.data.map(async (post) => {
          const commentsResponse = await API.get(`/comments/${post.id}`);
          return { ...post, comments: commentsResponse.data };
        })
      );
      setPosts(loadedPosts);
    } catch (err) {
      setStatusMessage("Unable to load posts right now.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    console.log("Sending request to /auth/profile");
    try {
      const response = await API.put("/auth/profile", formData);
      console.log("Profile update response:", response.data);
      updateUser(response.data);
      setStatusMessage("Profile picture updated.");
    } catch (err) {
      console.error("Profile update error:", err);
      console.error("Error details:", err.response?.data, err.response?.status);
      setStatusMessage("Profile upload failed.");
    }
  };

  const handleNewPostImage = (e) => {
    const file = e.target.files?.[0] || null;
    setNewPostImage(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !newPostImage) {
      setStatusMessage("Add text or a photo to post.");
      return;
    }

    const formData = new FormData();
    formData.append("content", newPost.trim());
    if (newPostImage) formData.append("image", newPostImage);

    try {
      setLoading(true);
      const response = await API.post("/posts", formData);
      const commentsResponse = await API.get(`/comments/${response.data.id}`);
      setPosts([{ ...response.data, comments: commentsResponse.data }, ...posts]);
      setNewPost("");
      setNewPostImage(null);
      setStatusMessage("Post created successfully.");
    } catch (err) {
      console.error("Create post error:", err.response?.data || err.message || err);
      setStatusMessage("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const response = await API.post(`/posts/${postId}/like`);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, likes: response.data.likes, liked: response.data.liked } : post
        )
      );
    } catch (err) {
      setStatusMessage("Unable to update like.");
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentText((current) => ({ ...current, [postId]: value }));
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const text = (commentText[postId] || "").trim();
    if (!text) return;

    try {
      const response = await API.post(`/comments/${postId}`, { body: text });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, response.data] }
            : post
        )
      );
      setCommentText((current) => ({ ...current, [postId]: "" }));
    } catch (err) {
      setStatusMessage("Unable to add comment.");
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await API.delete(`/posts/${postId}`);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setStatusMessage("Post deleted.");
    } catch (err) {
      console.error("Delete post error:", err.response?.data || err.message || err);
      setStatusMessage("Unable to delete post.");
    }
  };

  const profilePicture = user?.profile_pic || "/assets/logo-cat.png";

  return (
    <main className="cat-page">

      <section className="cat-create-post card">
        <div className="composer-header">
          <div className="composer-avatar">
            <img src={profilePicture} alt="Avatar" />
          </div>
          <div>
            <h3>Create Post</h3>
            <p>Share a photo or update.</p>
          </div>
        </div>

        <form className="post-composer" onSubmit={handleCreatePost}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
          />

          <div className="post-actions-row">
            <label className="upload-post-button">
              Add photo
              <input type="file" accept="image/*" onChange={handleNewPostImage} />
            </label>
            <button type="submit">Post</button>
          </div>

          {newPostImage && (
            <div className="post-image-preview">
              <img src={URL.createObjectURL(newPostImage)} alt="Preview" />
            </div>
          )}
        </form>
      </section>

      {statusMessage && <div className="success">{statusMessage}</div>}

      <section className="cat-feed">
        {loading && <p>Loading posts...</p>}
        {!loading && posts.length === 0 && (
          <div className="empty-state card">
            <h3>No posts yet</h3>
            <p>Be the first to share a cat photo or story.</p>
          </div>
        )}

        {posts.map((post) => (
          <article key={post.id} className="cat-post-card card">
            <div className="post-header">
              <div className="author-info">
                <img src={post.author_pic || "/assets/logo-cat.png"} alt={post.author_name} className="author-avatar" />
                <div>
                  <strong>{post.author_name}</strong>
                  <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'}</span>
                </div>
              </div>
              <div className="post-header-buttons">
                {user && post.authorId && (
                  <>
                    {console.log(`Post authorId: ${post.authorId}, User id: ${user.id}, Match: ${String(post.authorId) === String(user.id)}`)}
                    {String(post.authorId) === String(user.id) && (
                      <>
                        <Link to={`/post/${post.id}`} className="edit-post-button">
                          Edit
                        </Link>
                        <button type="button" className="delete-post-button" onClick={() => deletePost(post.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="post-content">{post.content}</p>
            {post.image_url && (
              <div className="post-image-preview">
                <img src={post.image_url} alt="Post" />
              </div>
            )}

            <div className="post-actions">
              <button type="button" className={post.liked ? "liked" : ""} onClick={() => toggleLike(post.id)}>
                {post.liked ? "💜 Liked" : "🤍 Like"}
              </button>
              <span>{post.likes} likes</span>
            </div>

            <div className="comments-section">
              <h4>Comments</h4>
              {post.comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first!</p>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment.commentId} className="comment-item">
                    <strong>{comment.author_name || comment.authorName}</strong>
                    <p>{comment.body}</p>
                  </div>
                ))
              )}

              <form className="comment-form" onSubmit={(e) => handleAddComment(e, post.id)}>
                <input
                  type="text"
                  value={commentText[post.id] || ""}
                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  placeholder="Write a comment..."
                />
                <button type="submit">Comment</button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default CatPage;
