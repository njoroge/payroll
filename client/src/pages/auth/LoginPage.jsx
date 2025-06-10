import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data); // Update auth context and localStorage
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6 col-xl-5">
                    <div className="card shadow-sm">
                        <div className="card-header text-center">
                            <h2 className="mb-0">Login</h2>
                        </div>
                        <div className="card-body p-4"> {/* Added some padding */}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email address</label> {/* Slightly improved label text */}
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-control form-control-lg" /* Added form-control-lg */
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="name@example.com"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        className="form-control form-control-lg" /* Added form-control-lg */
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Password"
                                    />
                                </div>
                                {error && <div className="alert alert-danger py-2" role="alert">{error}</div>} {/* Styled error as alert */}
                                <div className="d-grid"> {/* d-grid for full-width button */}
                                    <button
                                        type="submit"
                                        className="btn btn-success btn-lg" /* Changed to btn-primary */
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Logging in...
                                            </>
                                        ) : (
                                            'Login'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                        {/* Optional: Add links for password reset or registration if applicable */}
                        {/* <div className="card-footer text-center text-muted">
                            <p className="mb-0">Don't have an account? <Link to="/register-company">Register here</Link></p>
                            <p className="mb-0"><Link to="/forgot-password">Forgot password?</Link></p>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
