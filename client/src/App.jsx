import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/authContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterCompanyPage from './pages/auth/RegisterCompanyPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/common/ProtectedRoute';

// Employee Pages
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeForm from './pages/employees/EmployeeForm';
import ViewEmployeePage from './pages/employees/ViewEmployeePage';
import MyPayslipsPage from './pages/employees/MyPayslipsPage';


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


function AppContent() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-company" element={<RegisterCompanyPage />} />
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
