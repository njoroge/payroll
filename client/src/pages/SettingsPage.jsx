import React, { useState } from 'react';
import api from '../services/api'; // Import API service
import { useAuth } from '../store/authContext'; // Uncommented/Added useAuth
// import { useNavigate } from 'react-router-dom'; // Likely not needed if context handles redirect

const SettingsPage = () => {
  const { logout } = useAuth(); // Get logout from context
  // const navigate = useNavigate(); // Likely not needed

  // State for Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState({ type: '', text: '' });
  const [loadingPasswordChange, setLoadingPasswordChange] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordChangeMsg({ type: '', text: '' }); // Clear previous messages

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
        setPasswordChangeMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
        return;
    }

    setLoadingPasswordChange(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordChangeMsg({ type: 'success', text: response.data.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (err) {
      setPasswordChangeMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setLoadingPasswordChange(false);
    }
  };

  const handleLogout = () => {
    logout(); // Call context's logout function
    // AuthContext should handle redirect to /login
  };

  return (
    <div className="container mt-5">
      <h2>Settings</h2>
      <hr />

      <div className="row">
        {/* Change Password Section */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h4>Change Password</h4>
            </div>
            <div className="card-body">
              {passwordChangeMsg.text && (
                <div className={`alert alert-${passwordChangeMsg.type === 'error' ? 'danger' : 'success'} mt-2`}>
                  {passwordChangeMsg.text}
                </div>
              )}
              <form onSubmit={handleChangePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="currentPassword">Current Password:</label>
                  <input
                    type="password"
                    id="currentPassword"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="newPassword">New Password:</label>
                  <input
                    type="password"
                    id="newPassword"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="confirmNewPassword">Confirm New Password:</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    className="form-control"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loadingPasswordChange}>
                  {loadingPasswordChange ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h4>Account Actions</h4>
            </div>
            <div className="card-body">
              <p>Logout from your account.</p>
              {/* The main logout button is in MainLayout.jsx, this is an alternative location */}
              <button onClick={handleLogout} className="btn btn-danger">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
