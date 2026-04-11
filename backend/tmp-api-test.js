const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@thefolio.com', password: 'Admin@1234' }),
    });
    const login = await loginRes.json();
    console.log('login status:', loginRes.status, login);
    if (!loginRes.ok) return;
    const token = login.token;
    console.log('token length:', token.length);
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('local verify success:', decoded);
    } catch (error) {
      console.error('local verify error:', error.message);
    }

    const authHeader = `Bearer ${token}`;
    const getRes = await fetch(`${base}/posts`, {
      method: 'GET',
      headers: { Authorization: authHeader },
    });
    console.log('get posts status:', getRes.status, await getRes.text());

    const formData = new FormData();
    formData.append('content', 'Test from API script');
    const postRes = await fetch(`${base}/posts`, {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: formData,
    });
    const post = await postRes.json();
    console.log('create post status:', postRes.status, post);
  } catch (err) {
    console.error(err);
  }
})();