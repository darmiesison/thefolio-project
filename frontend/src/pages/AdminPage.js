import React, { useEffect, useState } from "react";
import API from "../api/axios";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await API.get('/admin/contact-messages');
      setMessages(response.data);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to load messages');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this contact message?')) return;
    try {
      const response = await API.delete(`/admin/contact-messages/${id}`);
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      setStatusMessage(response.data.message);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to delete message');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await API.get('/admin/posts');
      setPosts(response.data);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to load posts');
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    // image_url is already a full URL from the backend
    return image;
  };

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      const response = await API.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      setStatusMessage(response.data.message);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to delete post');
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const response = await API.put(`/admin/users/${id}/status`);
      setUsers((prev) => prev.map((user) => (user.id === id ? response.data.user : user)));
      setStatusMessage(response.data.message);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to change user status');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their content?')) return;
    try {
      const response = await API.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setStatusMessage(response.data.message);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPosts();
    fetchMessages();
  }, []);

  return (
    <div className="admin-page">
      <h2>Admin Dashboard</h2>
      <p>Manage registered users: deactivate, reactivate, or delete accounts.</p>

      {statusMessage && <div className="success-msg">{statusMessage}</div>}
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6">No registered users found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.status}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user.id)}
                          className="admin-action-button"
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="admin-delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <section className="admin-table-wrapper">
            <h3>All Posts</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Created</th>
                  <th>Image</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="5">No posts found.</td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.title || post.content?.slice(0, 30) || 'Untitled'}</td>
                      <td>{post.author_name}</td>
                      <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td>
                        {post.image_url ? (
                          <img
                            src={getImageUrl(post.image_url)}
                            alt="Post"
                            className="admin-post-thumbnail"
                            onClick={() => setZoomedImage(getImageUrl(post.image_url))}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          'No'
                        )}
                      </td>
                      <td>{post.status || 'published'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          className="admin-delete-button"
                        >
                          Delete Post
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="admin-message-feed">
            <h3>Contact Messages</h3>
            {messages.length === 0 ? (
              <p>No contact messages yet.</p>
            ) : (
              <div className="admin-message-list">
                {messages.map((msg) => (
                  <div key={msg.id} className="admin-message-card">
                    <div className="admin-message-header">
                      <div>
                        <strong>{msg.name}</strong>
                        <div className="admin-message-meta">
                          <span>{msg.email}</span>
                        </div>
                      </div>
                      <div>
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => deleteMessage(msg.id)}
                          className="admin-delete-button"
                          style={{ marginLeft: '12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="image-zoom-modal" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom-button" onClick={() => setZoomedImage(null)}>×</button>
            <img src={zoomedImage} alt="Zoomed" className="zoomed-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
