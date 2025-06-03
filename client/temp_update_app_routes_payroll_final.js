const fs = require('fs');
const appJsPath = './src/App.js';
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

const newPageImports = \`
import PayrollListPage from './pages/payrolls/PayrollListPage';
import RunPayrollPage from './pages/payrolls/RunPayrollPage';
import ViewPayslipPage from './pages/payrolls/ViewPayslipPage';
import MyPayslipsPage from './pages/employees/MyPayslipsPage';
\`;

appJsContent = appJsContent.replace(
    "const PayrollListPage = () => <div>Payroll List Page (Protected)</div>;", ""
);
appJsContent = appJsContent.replace(
    "const MyPayslipsPage = () => <div>My Payslips Page (Protected Employee Route)</div>;", ""
);


appJsContent = appJsContent.replace(
    "import AdvanceListPage from './pages/payrollops/AdvanceListPage';",
    \`import AdvanceListPage from './pages/payrollops/AdvanceListPage';
\${newPageImports}\`
);

const payrollMainRoutes = \`
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
        <Route path="/payrolls/:id" element={ {/* :id here is payroll._id */}
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager', 'employee']}>
            <ViewPayslipPage />
          </ProtectedRoute>
        } />
\`;

const myPayslipsRoute = \`
        <Route path="/employees/:employeeId/payslips" element={
          <ProtectedRoute roles={['employee', 'company_admin', 'employee_admin', 'hr_manager']}> {/* Admin/HR can also view this way */}
            <MyPayslipsPage />
          </ProtectedRoute>
        } />
\`;

const payrollRoutePattern = /<Route path="\\/payrolls"[^>]*>[\\s\\S]*?<\\/Route>/;
const myPayslipsPattern = /<Route path="\\/employees\\/:employeeId\\/payslips"[^>]*>[\\s\\S]*?<\\/Route>/;


if (appJsContent.match(payrollRoutePattern)) {
    appJsContent = appJsContent.replace(payrollRoutePattern, payrollMainRoutes);
} else {
    console.warn("Payroll list placeholder route not found for replacement in App.js.");
}

if (appJsContent.match(myPayslipsPattern)) {
    appJsContent = appJsContent.replace(myPayslipsPattern, myPayslipsRoute);
} else {
    console.warn("MyPayslips placeholder route not found for replacement in App.js.");
}


fs.writeFileSync(appJsPath, appJsContent, 'utf8');
console.log('Updated App.js with Payroll Processing & Payslip routes.');
