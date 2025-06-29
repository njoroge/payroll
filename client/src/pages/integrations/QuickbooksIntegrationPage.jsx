import React, { useState, useEffect } from 'react'; // useContext removed if AuthContext direct use is gone
import { useAuth } from '../../store/authContext'; // Import useAuth instead of AuthContext
import { getQuickbooksStatus, connectQuickbooks, disconnectQuickbooks } from '../../services/api'; // Using the actual API service
import styles from './QuickbooksIntegrationPage.module.css';

const QuickbooksIntegrationPage = () => {
    const { userInfo: user, loading: authLoading, isAuthenticated } = useAuth(); // Use useAuth() hook
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false); // For connect/disconnect buttons
    const [connectionStatus, setConnectionStatus] = useState({
        isConnected: false,
        realmId: null,
        connectedAt: null,
        needsReAuth: false,
        message: ''
    });
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState(''); // For success messages from actions

    useEffect(() => {
        // Define the roles allowed to manage QBO on this page
        const allowedRoles = ['company_admin', 'ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'];

        const fetchStatus = async () => {
            setIsLoading(true);
            setError('');
            setActionMessage('');
            try {
                const status = await getQuickbooksStatus();
                setConnectionStatus(status);
                if (!status.isConnected && status.message && status.needsReAuth) {
                    setActionMessage(status.message);
                } else if (status.isConnected && status.message) {
                    setActionMessage(status.message);
                }

                const queryParams = new URLSearchParams(window.location.search);
                const qboAction = queryParams.get('qbo_action');
                const qboStatus = queryParams.get('qbo_status');

                if (qboAction === 'callback') {
                    if (qboStatus === 'success') {
                        setActionMessage('Successfully connected to QuickBooks! Status has been updated.');
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else if (qboStatus === 'error') {
                        const errorMessage = queryParams.get('qbo_message') || 'An error occurred during QuickBooks connection.';
                        setError(`QuickBooks Connection Error: ${decodeURIComponent(errorMessage)}`);
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
            } catch (err) {
                console.error("Error fetching QuickBooks status:", err);
                setError(err.message || 'Failed to fetch QuickBooks status.');
                setConnectionStatus({ isConnected: false, realmId: null, message: 'Error fetching status.' });
            } finally {
                setIsLoading(false);
            }
        };

        if (user && allowedRoles.includes(user.role)) {
            fetchStatus();
        } else if (user) { // User is loaded but not in allowedRoles
            setError('You are not authorized to manage QuickBooks integration.');
        }
        // If !user, the main component return will handle "Loading user information..."
        // or the authLoading state will prevent premature rendering.
    }, [user]); // Re-fetch if user or user.role changes


    const handleConnect = () => {
        setActionMessage('');
        setError('');
        setIsActionLoading(true);
        // This function directly navigates, so the page will reload or change.
        // The user will be redirected to QBO and then back to the callback URL.
        // The callback URL (backend) should then redirect back to this page,
        // possibly with query parameters indicating success/failure.
        // e.g., /integrations/quickbooks?qbo_action=callback&qbo_status=success
        connectQuickbooks();
        // No need to set isActionLoading to false here as page will redirect
    };

    const handleDisconnect = async () => {
        setIsActionLoading(true);
        setError('');
        setActionMessage('');
        try {
            const response = await disconnectQuickbooks();
            setActionMessage(response.message || 'Successfully disconnected from QuickBooks.');
            // Refresh status after disconnecting
            const status = await getQuickbooksStatus();
            setConnectionStatus(status); // This should reflect disconnected state
        } catch (err) {
            console.error("Error disconnecting from QuickBooks:", err);
            setError(err.message || 'Failed to disconnect from QuickBooks.');
            // If disconnect fails, fetch status anyway to ensure UI is consistent
            try {
                const status = await getQuickbooksStatus();
                setConnectionStatus(status);
            } catch (statusErr) {
                setError(`Failed to disconnect and also failed to refresh status: ${statusErr.message}`);
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    // Basic loading and error display
    if (authLoading || !user) return <div className={styles.container}><p className={styles.info}>Loading user information...</p></div>;

    // Define roles allowed to view this page's content (management UI)
    const allowedRolesForPageAccess = ['company_admin', 'ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'];
    if (!allowedRolesForPageAccess.includes(user.role)) {
         return <div className={styles.container}><p className={styles.error}>Access Denied: You do not have permission to view this page.</p></div>;
    }

    // Initial page load message for authorized users
    if (isLoading && !connectionStatus.realmId && !error) return <div className={styles.container}><p className={styles.info}>Loading QuickBooks connection status...</p></div>;


    return (
        <div className={styles.container}>
            <h1 className={styles.title}>QuickBooks Online Integration</h1>

            {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
            {actionMessage && !error && <p className={`${styles.message} ${connectionStatus.isConnected ? styles.success : (connectionStatus.needsReAuth ? styles.warning : styles.info)}`}>{actionMessage}</p>}

            <div className={styles.statusSection}>
                <h2>Connection Status</h2>
                {isLoading && <p className={styles.info}>Checking status...</p>}
                {!isLoading && connectionStatus.isConnected && (
                    <>
                        {/* Message is shown above now via actionMessage */}
                        <p><strong>Status:</strong> <span className={styles.successText}>Connected</span></p>
                        <p><strong>QuickBooks Company ID (Realm ID):</strong> {connectionStatus.realmId}</p>
                        {connectionStatus.connectedAt && <p><strong>Connected At:</strong> {new Date(connectionStatus.connectedAt).toLocaleString()}</p>}
                        {connectionStatus.lastRefreshedAt && <p><strong>Last Token Refresh:</strong> {new Date(connectionStatus.lastRefreshedAt).toLocaleString()}</p>}
                        <button
                            onClick={handleDisconnect}
                            className={`${styles.button} ${styles.disconnectButton}`}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? 'Disconnecting...' : 'Disconnect from QuickBooks'}
                        </button>
                    </>
                )}
                {!isLoading && !connectionStatus.isConnected && (
                    <>
                        {/* Message is shown above now via actionMessage, unless it's a generic "Not Connected" */}
                         {(!actionMessage || !connectionStatus.needsReAuth) && !error && <p className={styles.info}>Not connected to QuickBooks.</p>}
                        <button
                            onClick={handleConnect}
                            className={`${styles.button} ${styles.connectButton}`}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? 'Connecting...' : (connectionStatus.needsReAuth ? 'Re-authorize Connection' : 'Connect to QuickBooks')}
                        </button>
                    </>
                )}
            </div>

            <div className={styles.actionsSection}>
                <h2>Actions</h2>
                <p>Once connected, you will be able to sync payroll data from the payroll processing pages.</p>
                {/* Placeholder for future actions like manual sync trigger for a period, or viewing sync logs */}
            </div>
        </div>
    );
};

export default QuickbooksIntegrationPage;
