const fs = require('fs');
const appJsPath = './src/App.js';
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

const newPageImports = `
import AdvanceListPage from './pages/payrollops/AdvanceListPage';
`;

appJsContent = appJsContent.replace(
    "const AdvanceListPage = () => <div>Advance List Page (Protected)</div>;", ""
);

appJsContent = appJsContent.replace(
    "import IncomeGradeListPage from './pages/incomegrades/IncomeGradeListPage';",
    `import IncomeGradeListPage from './pages/incomegrades/IncomeGradeListPage';
${newPageImports}`
);

const advanceRoute = `
        <Route path="/payroll-ops/advances" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <AdvanceListPage />
          </ProtectedRoute>
        } />
`;

const advanceRoutePattern = /<Route path="\/payroll-ops\/advances"[^>]*>[\s\S]*?<\/Route>/;

if (appJsContent.match(advanceRoutePattern)) {
    appJsContent = appJsContent.replace(advanceRoutePattern, advanceRoute);
} else {
    console.warn("Advance placeholder route not found for replacement in App.js.");
    // Fallback: try to insert it after income grades or another known route
    const igRouteEnd = '</ProtectedRoute>
        } />';
    const igRouteMarker = \`<Route path="/income-grades" element={
          <ProtectedRoute roles={['company_admin', 'employee_admin', 'hr_manager']}>
            <IncomeGradeListPage />
          </ProtectedRoute>
        } />\`;
    if(appJsContent.includes(igRouteMarker)){
        appJsContent = appJsContent.replace(igRouteMarker, \`\${igRouteMarker}
\${advanceRoute}\`);
    } else {
        console.error("Fallback insertion for Advance route also failed. Manual App.js check needed.");
    }
}

fs.writeFileSync(appJsPath, appJsContent, 'utf8');
console.log('Updated App.js with Payroll Operations (Advances) routes.');
