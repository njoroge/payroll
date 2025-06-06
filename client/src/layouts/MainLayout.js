import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar'; // Adjusted path
// import { useAuth } from '../store/authContext'; // Temporarily remove if not used directly in this simplified layout

const MainLayout = () => {
    // const { userInfo, logout, isAuthenticated } = useAuth(); // Temporarily remove
    // const navigate = useNavigate(); // Temporarily remove

    // const handleLogout = () => { // Temporarily remove
    //     logout();
    // };

    return (
        <div className="flex min-h-screen bg-gray-100"> {/* Main container for flex layout, added bg-gray-100 for contrast */}
            <Sidebar /> {/* Sidebar component */}

            {/* Main content area */}
            <main className="flex-1 p-4 md:ml-52 transition-all duration-300 ease-in-out">
                {/*
                    md:ml-52 assumes sidebar width is w-52 (208px).
                    Sidebar.js uses w-52.
                    On small screens, the sidebar is an overlay, so no margin needed.
                    On md screens and up, the margin pushes content to the right of the static sidebar.
                    Added transition for smoother margin change if sidebar width were dynamic (though it's fixed here).
                */}
                <Outlet /> {/* This renders the actual page content */}
            </main>

            {/* Footer can remain, but will be pushed by flex content. Or be part of the main scrollable area.
                For simplicity, let's include it inside the main content scrollable area.
            */}
            {/*
            <footer style={{ textAlign: 'center', padding: '1rem', marginTop: '2rem', borderTop: '1px solid #ccc' }}>
                Payroll MERN App &copy; 2023
            </footer>
            */}
            {/* Better placement for footer might be inside main or as a separate section if it needs to be sticky etc.
                For this iteration, focusing on sidebar integration. The footer provided in the original MainLayout
                was outside <main>. If it needs to be full-width below everything, it should be outside the flex div,
                or the flex div should be column and this main section should grow.
                Let's put a simplified footer inside the main content area for now.
            */}
            <footer className="text-center p-4 text-gray-600 text-sm">
                Payroll MERN App &copy; 2024
            </footer>
        </div>
    );
};

export default MainLayout;
