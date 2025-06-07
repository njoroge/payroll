import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
    return (
        <div>
            <h2>Access Denied</h2>
            <p>You do not have the necessary permissions to view this page.</p>
            <Link to="/">Go to Homepage</Link>
        </div>
    );
};

export default UnauthorizedPage;
