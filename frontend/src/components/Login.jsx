import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { googleLogin } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaUsers, FaShieldAlt, FaUserTie, FaUserCheck } from 'react-icons/fa';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await googleLogin(credentialResponse.credential);
            login(res.data);

            // Route based on role
            switch (res.data.role) {
                case 'ADMIN':
                    navigate('/admin');
                    break;
                case 'MANAGER':
                    navigate('/manager');
                    break;
                case 'EMPLOYEE':
                    navigate('/employee');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setError('Authentication failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        setError('Google Sign-In failed. Please try again.');
    };

    return (
        <div className="login-page">
            <div className="login-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            <FaUsers />
                        </div>
                        <h1>Employee Management</h1>
                        <p className="login-subtitle">Streamline your workforce management</p>
                    </div>

                    <div className="login-features">
                        <div className="feature-item">
                            <FaShieldAlt className="feature-icon" />
                            <span>Admin Control</span>
                        </div>
                        <div className="feature-item">
                            <FaUserTie className="feature-icon" />
                            <span>Manager Tools</span>
                        </div>
                        <div className="feature-item">
                            <FaUserCheck className="feature-icon" />
                            <span>Employee Portal</span>
                        </div>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <div className="login-btn-wrapper">
                        {loading ? (
                            <div className="login-spinner">
                                <div className="spinner"></div>
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={handleSuccess}
                                onError={handleError}
                                theme="filled_blue"
                                size="large"
                                width="320"
                                text="signin_with"
                                shape="rectangular"
                            />
                        )}
                    </div>

                    <p className="login-footer">
                        Secure authentication powered by Google
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
