import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchPost();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/posts/${id}`);
      setPost(response.data);
    } catch (err) {
      setStatusMessage("Unable to load post.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await API.get(`/comments/${id}`);
      setComments(response.data);
    } catch (err) {
      console.error("Unable to load comments.");
    }
  };

  const handleEditToggle = () => {
    setEditMode((current) => !current);
    setEditContent(post?.content || "");
    setEditImage(null);
    setEditPreview("");
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setEditImage(file);
    setEditPreview(file ? URL.createObjectURL(file) : "");
  };

  const savePostEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("content", editContent.trim());
      if (editImage) {
        formData.append("image", editImage);
      }
      const response = await API.put(`/posts/${id}`, formData);
      setPost(response.data);
      setStatusMessage("Post updated successfully.");
      setEditMode(false);
      setEditImage(null);
      setEditPreview("");
    } catch (err) {
      console.error("Unable to save post edit.", err.response?.data || err.message);
      setStatusMessage("Unable to save post.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    try {
      const response = await API.post(`/posts/${id}/like`);
      setPost((prev) => ({ ...prev, likes: response.data.likes, liked: response.data.liked }));
    } catch (err) {
      setStatusMessage("Unable to update like.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    try {
      const response = await API.post(`/comments/${id}`, { body: text });
      setComments((prev) => [...prev, response.data]);
      setCommentText("");
    } catch (err) {
      setStatusMessage("Unable to add comment.");
    }
  };

  const deletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await API.delete(`/posts/${id}`);
      setStatusMessage("Post deleted.");
      // Redirect to my posts or feed
    } catch (err) {
      setStatusMessage("Unable to delete post.");
    }
  };

  if (loading) return <p>Loading post...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <main className="post-detail-page">
      <Link to="/my-posts" className="back-link">← Back to My Posts</Link>
      <article className="cat-post-card card">
        <div className="post-header">
          <div className="author-info">
            <img src={post.author_pic || "/assets/logo-cat.png"} alt={post.author_name} className="author-avatar" />
            <div>
              <strong>{post.author_name}</strong>
              <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'}</span>
            </div>
          </div>
          <div className="post-header-buttons">
            {post.authorId === user.id && (
              <>
                <button type="button" className="edit-post-button" onClick={handleEditToggle}>
                  {editMode ? "Cancel" : "Edit"}
                </button>
                <button type="button" className="delete-post-button" onClick={deletePost}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {editMode ? (
          <form className="edit-post-form" onSubmit={savePostEdit}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              placeholder="Update your post content"
            />
            <label className="upload-post-button">
              Change photo
              <input type="file" accept="image/*" onChange={handleEditImageChange} />
            </label>
            {editPreview && (
              <div className="post-image-preview">
                <img src={editPreview} alt="Preview" />
              </div>
            )}
            <button type="submit" className="save-post-button">Save Changes</button>
          </form>
        ) : (
          <>
            <p className="post-content">{post.content}</p>
            {post.image_url && (
              <div className="post-image-preview">
                <img src={post.image_url} alt="Post" />
              </div>
            )}
          </>
        )}

        <div className="post-actions">
          <button
            className={`like-button ${post.liked ? "liked" : ""}`}
            onClick={toggleLike}
          >
            ❤️ {post.likes}
          </button>
        </div>

        {!editMode && (
          <div className="comments-section">
            <h4>Comments</h4>
            {comments.map((comment) => (
              <div key={comment.commentId} className="comment">
                <img src={comment.author_pic || "/assets/logo-cat.png"} alt={comment.author_name || comment.authorName} className="comment-avatar" />
                <div>
                  <strong>{comment.author_name || comment.authorName}</strong>
                  <p>{comment.body}</p>
                  <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}</span>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
              />
              <button type="submit">Comment</button>
            </form>
          </div>
        )}
      </article>
      {statusMessage && <div className="success">{statusMessage}</div>}
    </main>
  );
}

export default PostDetailPage;