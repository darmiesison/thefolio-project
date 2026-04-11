// frontend/src/pages/RegisterPage.js
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data } = await API.post('/auth/register', form);
      
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      
      // Update Axios defaults for future requests
      API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className='register-page'>
      <h2>Create an Account</h2>
      
      {error && <p className='error-msg'>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input
          name='name'
          placeholder='Full name'
          value={form.name}
          onChange={handleChange}
          required
        />
        
        <input
          name='email'
          type='email'
          placeholder='Email'
          value={form.email}
          onChange={handleChange}
          required
        />
        
        <input
          name='password'
          type='password'
          placeholder='Password (min 6 chars)'
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />
        
        <button type='submit'>Register</button>
      </form>
      
      <p>
        Already have an account? <Link to='/login'>Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;