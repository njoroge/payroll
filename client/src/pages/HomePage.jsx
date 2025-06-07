import React from 'react';
import { useAuth } from '../store/authContext';

const HomePage = () => {
    const { userInfo } = useAuth();
    return (
        <div>
            <h1>Welcome to the Payroll System</h1>
            {userInfo ? (
                <div>
                    <p>You are logged in as: {userInfo.email}</p>
                    <p>Role: {userInfo.role}</p>
                    {userInfo.company && <p>Company: {userInfo.company.name} ({userInfo.company.taxPin})</p>}
                    {userInfo.employee && <p>Employee: {userInfo.employee.firstName} {userInfo.employee.lastName}</p>}
                </div>
            ) : (
                <p>Please log in or register a company to continue.</p>
            )}
        </div>
    );
};
export default HomePage;
