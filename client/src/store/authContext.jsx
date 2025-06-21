import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuthToken = async () => {
            const storedUserInfoString = localStorage.getItem('userInfo');
            if (storedUserInfoString) {
                try {
                    const storedUserInfo = JSON.parse(storedUserInfoString);
                    const token = storedUserInfo?.token;

                    if (token) {
                        const response = await fetch(window.location.origin + '/api/auth/me', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        if (response.ok) {
                            const freshUserData = await response.json();
                            setUserInfo(freshUserData);
                            // Update localStorage with fresh data, potentially including a renewed token or updated details
                            localStorage.setItem('userInfo', JSON.stringify(freshUserData));
                        } else {
                            // Token is invalid or expired
                            localStorage.removeItem('userInfo');
                            setUserInfo(null);
                        }
                    } else {
                        // No token found in stored user info
                        localStorage.removeItem('userInfo');
                        setUserInfo(null);
                    }
                } catch (error) {
                    // Error parsing JSON or other unexpected issue
                    console.error("Auth verification error:", error);
                    localStorage.removeItem('userInfo');
                    setUserInfo(null);
                }
            }
            setLoading(false);
        };

        verifyAuthToken();
    }, []);

    const login = (userData) => {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUserInfo(userData);
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUserInfo(null);
        // Optionally redirect to login or home page
        window.location.href = '/login'; // Simple redirect
    };

    const value = {
        userInfo,
        isAuthenticated: !!userInfo,
        login,
        logout,
        loading // To handle initial load state
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
