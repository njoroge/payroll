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
                <div><label>Company Name: <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required /></label></div>
                <div><label>Company Tax PIN: <input type="text" name="companyTaxPin" value={formData.companyTaxPin} onChange={handleChange} required /></label></div>
                <div><label>Company Email: <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} required /></label></div>
                <div><label>Company Location: <input type="text" name="companyLocation" value={formData.companyLocation} onChange={handleChange} /></label></div>
                <div><label>Company Phone: <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleChange} /></label></div>

                <h3>Admin User Details</h3>
                <div><label>Admin Email: <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required /></label></div>
                <div><label>Admin Password: <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} required minLength="6" /></label></div>
                <div><label>Confirm Admin Password: <input type="password" name="adminConfirmPassword" value={formData.adminConfirmPassword} onChange={handleChange} required /></label></div>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Registering...' : 'Register Company'}</button>
            </form>
        </div>
    );
};

export default RegisterCompanyPage;
