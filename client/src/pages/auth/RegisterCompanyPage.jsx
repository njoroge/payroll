import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            setSuccess('Company registered successfully! You will be logged in.');
            // Automatically log in the new company admin
            login(data); // data should contain user info and token
            setTimeout(() => navigate('/'), 2000); // Redirect to dashboard after a short delay

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Register New Company</h2>
            <form onSubmit={handleSubmit}>
                <h3>Company Details</h3>
                <div className="mb-3"><label htmlFor="companyName" className="form-label">Company Name: </label><input type="text" name="companyName" id="companyName" className="form-control" value={formData.companyName} onChange={handleChange} required /></div>
                <div className="mb-3"><label htmlFor="companyTaxPin" className="form-label">Company Tax PIN: </label><input type="text" name="companyTaxPin" id="companyTaxPin" className="form-control" value={formData.companyTaxPin} onChange={handleChange} required /></div>
                <div className="mb-3"><label htmlFor="companyEmail" className="form-label">Company Email: </label><input type="email" name="companyEmail" id="companyEmail" className="form-control" value={formData.companyEmail} onChange={handleChange} required /></div>
                <div className="mb-3"><label htmlFor="companyLocation" className="form-label">Company Location: </label><input type="text" name="companyLocation" id="companyLocation" className="form-control" value={formData.companyLocation} onChange={handleChange} /></div>
                <div className="mb-3"><label htmlFor="companyPhone" className="form-label">Company Phone: </label><input type="tel" name="companyPhone" id="companyPhone" className="form-control" value={formData.companyPhone} onChange={handleChange} /></div>

                <h3>Admin User Details</h3>
                <div className="mb-3"><label htmlFor="adminEmail" className="form-label">Admin Email: </label><input type="email" name="adminEmail" id="adminEmail" className="form-control" value={formData.adminEmail} onChange={handleChange} required /></div>
                <div className="mb-3"><label htmlFor="adminPassword" className="form-label">Admin Password: </label><input type="password" name="adminPassword" id="adminPassword" className="form-control" value={formData.adminPassword} onChange={handleChange} required minLength="6" /></div>
                <div className="mb-3"><label htmlFor="adminConfirmPassword" className="form-label">Confirm Admin Password: </label><input type="password" name="adminConfirmPassword" id="adminConfirmPassword" className="form-control" value={formData.adminConfirmPassword} onChange={handleChange} required /></div>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Registering...' : 'Register Company'}</button>
            </form>
        </div>
    );
};

export default RegisterCompanyPage;
