import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/authContext';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterCompanyPage from './pages/auth/RegisterCompanyPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRouteOnly from './components/common/PublicRouteOnly';

// Employee Pages
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeForm from './pages/employees/EmployeeForm';
import ViewEmployeePage from './pages/employees/ViewEmployeePage';
import MyPayslipsPage from './pages/employees/MyPayslipsPage'; // Existing, may be different from new PaystubsPage
import PaystubsPage from './pages/PaystubsPage'; // New page for /my-paystubs

// Employee Self-Service Pages
import TaxFormsPage from './pages/employee_self_service/TaxFormsPage';
import RequestLeavePage from './pages/employee_self_service/RequestLeavePage'; // New
import MyLeaveHistoryPage from './pages/employee_self_service/MyLeaveHistoryPage'; // New
import PersonalInformationPage from './pages/employee_self_service/PersonalInformationPage';

// Department Pages
import DepartmentListPage from './pages/departments/DepartmentListPage';

// IncomeGrade Pages
import IncomeGradeListPage from './pages/incomegrades/IncomeGradeListPage';

// Payroll Operations Pages
import AdvanceListPage from './pages/payrollops/AdvanceListPage';

// Payroll & Payslip Pages
import PayrollListPage from './pages/payrolls/PayrollListPage';
import RunPayrollPage from './pages/payrolls/RunPayrollPage';
import ViewPayslipPage from './pages/payrolls/ViewPayslipPage';

// Help Page
import HelpPage from './pages/HelpPage';

// Benefits Page
import BenefitsPage from './pages/BenefitsPage';

// Settings Page
import SettingsPage from './pages/SettingsPage';

// Chat Page
import ChatPage from './pages/ChatPage';

// HR Specific Pages
import ManageLeaveRequestsPage from './pages/employees/ManageLeaveRequestsPage'; // New

// Report Pages
import UserPayslipReportPage from './pages/reports/UserPayslipReportPage';
import PrintablePayslipView from './components/reports/PrintablePayslipView';

// Integrations Pages
import QuickbooksIntegrationPage from './pages/integrations/QuickbooksIntegrationPage';


function AppContent() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRouteOnly><LoginPage /></PublicRouteOnly>} />
        <Route path="/register-company" element={<PublicRouteOnly><RegisterCompanyPage /></PublicRouteOnly>} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />

        {/* Employee Routes */}
        <Route path="/employees" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <EmployeeListPage />
          </ProtectedRoute>
        } />
        <Route path="/employees/new" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <EmployeeForm isEditMode={false} />
          </ProtectedRoute>
        } />
        <Route path="/employees/:id" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager', 'employee']}>
            <ViewEmployeePage />
          </ProtectedRoute>
        } />
        <Route path="/employees/:id/edit" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <EmployeeForm isEditMode={true} />
          </ProtectedRoute>
        } />
        <Route path="/employees/:employeeId/payslips" element={
          <ProtectedRoute roles={['employee', 'company_admin', 'employee_admin', 'hr_manager']}>
            <MyPayslipsPage />
          </ProtectedRoute>
        } />

        {/* Department Routes */}
        <Route path="/departments" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <DepartmentListPage />
          </ProtectedRoute>
        } />

        {/* Income Grade Routes */}
        <Route path="/income-grades" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <IncomeGradeListPage />
          </ProtectedRoute>
        } />

        {/* Payroll Operations Routes */}
        <Route path="/payroll-ops/advances" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <AdvanceListPage />
          </ProtectedRoute>
        } />

        {/* Payroll & Payslips Routes */}
        <Route path="/payrolls" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <PayrollListPage />
          </ProtectedRoute>
        } />
        <Route path="/payrolls/run" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <RunPayrollPage />
          </ProtectedRoute>
        } />
        <Route path="/payrolls/:id" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager', 'employee']}>
            <ViewPayslipPage />
          </ProtectedRoute>
        } />

        {/* Routes for an employee to view their own paystubs */}
        <Route path="/my-paystubs" element={
          <ProtectedRoute roles={['employee']}> {/* Primarily for employees */}
            <PaystubsPage />
          </ProtectedRoute>
        } />
        <Route path="/my-paystubs/:payslipId" element={
          <ProtectedRoute roles={['employee']}> {/* Primarily for employees */}
            <PaystubsPage /> {/* Assuming PaystubsPage handles both list and detail view */}
          </ProtectedRoute>
        } />

        {/* Benefits Page Route - Primarily for employees */}
        <Route path="/my-benefits" element={
          <ProtectedRoute roles={['employee']}>
            <BenefitsPage />
          </ProtectedRoute>
        } />

        {/* Employee Self-Service Routes */}
        <Route path="/my-tax-forms" element={
          <ProtectedRoute roles={['employee']}>
            <TaxFormsPage />
          </ProtectedRoute>
        } />
        <Route path="/my-leave-request" element={
          <ProtectedRoute roles={['employee']}>
            <RequestLeavePage />
          </ProtectedRoute>
        } />
        <Route path="/my-leave-history" element={
          <ProtectedRoute roles={['employee']}>
            <MyLeaveHistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/my-personal-info" element={
          <ProtectedRoute roles={['employee']}>
            <PersonalInformationPage />
          </ProtectedRoute>
        } />

        {/* Help Page Route - Accessible to all authenticated users */}
        <Route path="/help" element={<HelpPage />} />

        {/* Settings Page Route - Accessible to all authenticated users */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Chat/Messages Page Route - Accessible to all authenticated users (further role restrictions can be added if needed) */}
        <Route path="/messages" element={<ChatPage />} />

        {/* User Payslip Report Route - Accessible to all authenticated users with an employee profile */}
        <Route path="/reports/my-payslips" element={
          <ProtectedRoute roles={['employee', 'company_admin', 'hr_manager', 'employee_admin']}>
            <UserPayslipReportPage />
          </ProtectedRoute>
        } />

        {/* Route for printing a single payslip from the report - Accessible to relevant roles */}
        <Route path="/reports/my-payslips/print/:payslipId" element={
          <ProtectedRoute roles={['employee', 'company_admin', 'hr_manager', 'employee_admin']}>
            <PrintablePayslipView />
          </ProtectedRoute>
        } />

        {/* HR/Admin specific routes */}
        <Route path="/employees/manage-leave-requests" element={
          <ProtectedRoute roles={['hr_manager', 'employee_admin', 'company_admin']}>
            <ManageLeaveRequestsPage />
          </ProtectedRoute>
        } />

        {/* Integrations Route */}
        <Route path="/integrations/quickbooks" element={
          <ProtectedRoute roles={['company_admin', 'hr_manager', 'SUPERADMIN']}>
            <QuickbooksIntegrationPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
