import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const RunPayrollPage = () => {
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [runForAll, setRunForAll] = useState(true);
    const [loading, setLoading] = useState(false); // For payroll run
    const [fetchLoading, setFetchLoading] = useState(false); // For fetching employees
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const navigate = useNavigate();

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchActiveEmployees = async () => {
            setFetchLoading(true);
            try {
                const { data } = await api.get('/employees?workStatus=ACTIVE');
                setEmployees(data);
            } catch (err) {
                setError("Failed to fetch employees list. Please ensure employees are added.");
                console.error(err);
            }
            setFetchLoading(false);
        };
        fetchActiveEmployees();
    }, []);

    const handleEmployeeSelection = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeIds(prev =>
            prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!month || !year) {
            setError("Month and year are required.");
            return;
        }
        if (!runForAll && selectedEmployeeIds.length === 0) {
            setError("Please select at least one employee or choose 'Run for All Active'.");
            return;
        }

        setLoading(true); setError(''); setResult(null);
        const payload = {
            month,
            year,
            employeeIds: runForAll ? null : selectedEmployeeIds,
        };

        try {
            const { data } = await api.post('/payrolls/run', payload);
            setResult(data);
            if (data.message && data.message.toLowerCase().includes("successfully")) { // More robust check
                 setTimeout(() => navigate('/payrolls'), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payroll processing failed.');
            if (err.response?.data?.errors) {
                setResult({ errors: err.response.data.errors, message: err.response.data.message || 'Payroll run completed with errors.' });
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="row justify-content-center">
                <div className="col-lg-10 col-xl-8">
                    <div className="card shadow-sm">
                        <div className="card-header text-center">
                            <h2 className="mb-0">Run New Payroll</h2>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="row mb-3">
                                    <div className="col-md-6 mb-3 mb-md-0"> {/* Adjusted mb for responsive */}
                                        <label htmlFor="payrollMonth" className="form-label">Month:</label>
                                        <select id="payrollMonth" className="form-select form-select-lg" value={month} onChange={e => setMonth(e.target.value)}> {/* Added form-select-lg */}
                                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="payrollYear" className="form-label">Year:</label>
                                        <select id="payrollYear" className="form-select form-select-lg" value={year} onChange={e => setYear(parseInt(e.target.value))}> {/* Added form-select-lg */}
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-3 form-check">
                                    <input type="checkbox" id="runForAll" className="form-check-input" checked={runForAll} onChange={(e) => setRunForAll(e.target.checked)} />
                                    <label htmlFor="runForAll" className="form-check-label">
                                        Run for All Active Employees
                                    </label>
                                </div>

                                {!runForAll && (
                                    <div className="mb-4 p-3 border rounded bg-light"> {/* Styled employee selection area */}
                                        <h4 className="fs-5 fw-semibold mb-3">Select Employees:</h4>
                                        {fetchLoading && <p className="text-muted fst-italic">Loading employees...</p>}
                                        {!fetchLoading && employees.length === 0 && <p className="text-muted">No active employees found to select.</p>}
                                        <div style={{maxHeight: '200px', overflowY: 'auto'}}> {/* Scrollable employee list */}
                                            {employees.map(emp => (
                                                <div key={emp._id} className="form-check">
                                                    <input type="checkbox" id={`emp-${emp._id}`} className="form-check-input" value={emp._id} checked={selectedEmployeeIds.includes(emp._id)} onChange={handleEmployeeSelection} />
                                                    <label htmlFor={`emp-${emp._id}`} className="form-check-label">
                                                        {emp.firstName} {emp.lastName} ({emp.nationalId || 'N/A'})
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error and Result display section */}
                                {error && <div className="alert alert-danger my-3 py-2">{error}</div>}
                                {result && (
                                    <div className={`alert ${result.errorCount || (result.errors && result.errors.length > 0) ? (result.processedCount > 0 ? 'alert-warning' : 'alert-danger') : 'alert-success'} my-3 py-2`} role="alert">
                                        <p className="fw-bold mb-1">{result.message}</p>
                                        {result.processedCount !== undefined && <p className="mb-1">Successfully processed: {result.processedCount}</p>}
                                        {result.errorCount !== undefined && <p className="mb-1">Errors: {result.errorCount}</p>}
                                        {result.errors?.map(errDetail => (
                                            <p key={errDetail.employeeId || Math.random()} className="mb-1 small">
                                                <span className="fw-bold text-warning">Emp ID {errDetail.employeeId || 'N/A'}:</span> {errDetail.message}
                                            </p>
                                        ))}
                                        {result.results?.length > 0 && result.processedCount === result.results.length && !(result.errorCount > 0) && <p className="mb-0">All selected employees processed successfully.</p>}
                                    </div>
                                )}

                                <div className="mt-4 d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/payrolls')} disabled={loading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-success btn-lg" disabled={loading || fetchLoading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            'Run Payroll'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default RunPayrollPage;
