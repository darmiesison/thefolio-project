// frontend/src/pages/LoginPage.js
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Assuming login function in AuthContext returns the user object
      const user = await login(email, password);
      
      // Safety check: Redirect based on role
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      // Standardizing error extraction
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className='login-page'>
      <h2>Log into The Folio</h2>
      
      {error && <p className='error-msg'>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input
          type='email'
          placeholder='Email address'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type='submit'>Login</button>
      </form>
      
      <p>
        Don't have an account? <Link to='/register'>Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage;