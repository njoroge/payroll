import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import api from '../../services/api';
import { useAuth } from '../../store/authContext';


const RegisterCompanyPage = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        companyTaxPin: '',
        companyEmail: '',
        companyLocation: '',
        companyPhone: '',
        adminEmail: '',
        adminPassword: '',
        adminConfirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.adminPassword !== formData.adminConfirmPassword) {
            setError('Admin passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/company/register', formData);
            setSuccess('Company registered successfully! Redirecting to login...'); // Updated message slightly
            login(data); // Log in the admin of the newly registered company
            setTimeout(() => navigate('/'), 3000); // Redirect to dashboard/homepage after a delay

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 mb-5"> {/* Added mb-5 for bottom margin */}
            <div className="row justify-content-center">
                <div className="col-lg-8 col-xl-7"> {/* Adjusted column width */}
                    <div className="card shadow-sm">
                        <div className="card-header text-center">
                            <h2 className="mb-0">Register New Company</h2>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                <h3 className="fs-5 fw-semibold mb-3">Company Details</h3> {/* Styled h3 */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="companyName" className="form-label">Company Name:</label>
                                        <input type="text" name="companyName" id="companyName" className="form-control" value={formData.companyName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="companyTaxPin" className="form-label">Company Tax PIN:</label>
                                        <input type="text" name="companyTaxPin" id="companyTaxPin" className="form-control" value={formData.companyTaxPin} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="companyEmail" className="form-label">Company Email:</label>
                                    <input type="email" name="companyEmail" id="companyEmail" className="form-control" value={formData.companyEmail} onChange={handleChange} required />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="companyLocation" className="form-label">Company Location:</label>
                                        <input type="text" name="companyLocation" id="companyLocation" className="form-control" value={formData.companyLocation} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="companyPhone" className="form-label">Company Phone:</label>
                                        <input type="tel" name="companyPhone" id="companyPhone" className="form-control" value={formData.companyPhone} onChange={handleChange} />
                                    </div>
                                </div>

                                <hr className="my-4" />
                                <h3 className="fs-5 fw-semibold mb-3">Admin User Details</h3> {/* Styled h3 */}
                                <div className="mb-3">
                                    <label htmlFor="adminEmail" className="form-label">Admin Email:</label>
                                    <input type="email" name="adminEmail" id="adminEmail" className="form-control" value={formData.adminEmail} onChange={handleChange} required />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="adminPassword" className="form-label">Admin Password:</label>
                                        <input type="password" name="adminPassword" id="adminPassword" className="form-control" value={formData.adminPassword} onChange={handleChange} required minLength="6" />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="adminConfirmPassword" className="form-label">Confirm Admin Password:</label>
                                        <input type="password" name="adminConfirmPassword" id="adminConfirmPassword" className="form-control" value={formData.adminConfirmPassword} onChange={handleChange} required />
                                    </div>
                                </div>

                                {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}
                                {success && <div className="alert alert-success mt-3 py-2">{success}</div>}

                                <div className="d-grid gap-2 mt-4"> {/* d-grid for full width buttons */}
                                    <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Registering...
                                            </>
                                        ) : (
                                            'Register Company'
                                        )}
                                    </button>
                                    <Link to="/login" className="btn btn-outline-secondary">Cancel</Link> {/* Added Cancel button */}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterCompanyPage;
