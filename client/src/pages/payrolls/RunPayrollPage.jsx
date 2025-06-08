import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const RunPayrollPage = () => {
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [runForAll, setRunForAll] = useState(true);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
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
                setError("Failed to fetch employees list.");
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
            if (data.message.includes("successfully")) {
                 setTimeout(() => navigate('/payrolls'), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payroll processing failed.');
            if (err.response?.data?.errors) {
                setResult({ errors: err.response.data.errors, message: err.response.data.message });
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Run Payroll</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Month:
                        <select value={month} onChange={e => setMonth(e.target.value)}>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </label>
                    <label style={{ marginLeft: '10px' }}>Year:
                        <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </label>
                </div>

                <div style={{ margin: '1rem 0' }}>
                    <label>
                        <input type="checkbox" checked={runForAll} onChange={(e) => setRunForAll(e.target.checked)} />
                        Run for All Active Employees
                    </label>
                </div>

                {!runForAll && (
                    <div>
                        <h4>Select Employees:</h4>
                        {fetchLoading && <p>Loading employees...</p>}
                        {employees.map(emp => (
                            <div key={emp._id}>
                                <label>
                                    <input type="checkbox" value={emp._id} checked={selectedEmployeeIds.includes(emp._id)} onChange={handleEmployeeSelection} />
                                    {emp.firstName} {emp.lastName} ({emp.nationalId})
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {result && (
                    <div style={{margin: '1rem 0', padding: '1rem', border: result.errors ? '1px solid red' : '1px solid green' }}>
                        <p>{result.message}</p>
                        {result.processedCount && <p>Successfully processed: {result.processedCount}</p>}
                        {result.errorCount && <p>Errors: {result.errorCount}</p>}
                        {result.errors?.map(err => <p key={err.employeeId} style={{color: 'orange'}}>Emp ID {err.employeeId}: {err.message}</p>)}
                        {result.results?.length > 0 && !result.errors && <p>All selected employees processed.</p>}
                    </div>
                )}

                <button type="submit" disabled={loading || fetchLoading}>
                    {loading ? 'Processing...' : 'Run Payroll'}
                </button>
                <button type="button" onClick={() => navigate('/payrolls')} style={{ marginLeft: '10px' }} disabled={loading}>Cancel</button>
            </form>
        </div>
    );
};
export default RunPayrollPage;
