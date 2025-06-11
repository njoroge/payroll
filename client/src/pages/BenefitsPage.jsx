import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatting';

const BenefitsPage = () => {
    const { userInfo } = useAuth();

    const [employeeDetails, setEmployeeDetails] = useState(userInfo?.employee || null); // Initialize with employee data from userInfo if available
    const [financialSummary, setFinancialSummary] = useState(null);
    const [activeAdvances, setActiveAdvances] = useState([]);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i); // Last 5 years

    const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
    const [errorEmployeeDetails, setErrorEmployeeDetails] = useState(null);

    const [loadingFinancialSummary, setLoadingFinancialSummary] = useState(false);
    const [errorFinancialSummary, setErrorFinancialSummary] = useState(null);

    const [loadingAdvances, setLoadingAdvances] = useState(false);
    const [errorAdvances, setErrorAdvances] = useState(null);

    // Effect to fetch full employee details if not sufficiently available in userInfo.employee
    useEffect(() => {
        const currentEmployeeDetails = userInfo?.employee;
        // Fetch if we have a user, an employee record is associated, but key details are missing.
        if (userInfo && userInfo.employee?._id && (!currentEmployeeDetails?.nhifNo || !currentEmployeeDetails?.nssfNo || !currentEmployeeDetails?.kraPin)) {
            setLoadingEmployeeDetails(true);
            setErrorEmployeeDetails(null);
            api.get(`/employees/me`) // /me endpoint uses token to find the employee
                .then(response => {
                    setEmployeeDetails(response.data);
                })
                .catch(err => {
                    console.error("Error fetching full employee details:", err);
                    setErrorEmployeeDetails(err.response?.data?.message || "Failed to fetch employee details.");
                })
                .finally(() => {
                    setLoadingEmployeeDetails(false);
                });
        } else if (currentEmployeeDetails) { // If userInfo.employee exists and has needed fields, use it.
            setEmployeeDetails(currentEmployeeDetails);
        }
    }, [userInfo]);

    // Effect to fetch financial summary
    useEffect(() => {
        if (userInfo && userInfo.employee?._id && selectedYear) {
            setLoadingFinancialSummary(true);
            setErrorFinancialSummary(null);
            // This API endpoint `/api/employees/me/financial-summary` uses token to identify employee
            api.get(`/employees/me/financial-summary?year=${selectedYear}`)
                .then(response => {
                    setFinancialSummary(response.data);
                })
                .catch(err => {
                    console.error("Error fetching financial summary:", err);
                    setErrorFinancialSummary(err.response?.data?.message || `Failed to fetch financial summary for ${selectedYear}.`);
                    setFinancialSummary(null); // Clear previous data on error
                })
                .finally(() => {
                    setLoadingFinancialSummary(false);
                });
        }
    }, [userInfo, selectedYear]);

    // Effect to fetch active advances
    useEffect(() => {
        if (userInfo && userInfo.employee?._id) {
            setLoadingAdvances(true);
            setErrorAdvances(null);
            // This API endpoint `/api/employees/me/advances` uses token to identify employee
            api.get(`/employees/me/advances`)
                .then(response => {
                    setActiveAdvances(response.data.advances || response.data || []);
                })
                .catch(err => {
                    console.error("Error fetching active advances:", err);
                    setErrorAdvances(err.response?.data?.message || "Failed to fetch active advances.");
                })
                .finally(() => {
                    setLoadingAdvances(false);
                });
        }
    }, [userInfo]);

    if (!userInfo || !userInfo.employee?._id) { // Updated check
        return <div className="container mt-5"><p>Loading user information or user not fully set up...</p></div>;
    }

    if (loadingEmployeeDetails && !employeeDetails) { // Show main loading only if initial details are missing and being fetched
        return <div className="container mt-5"><p>Loading benefits information...</p></div>;
    }

    if (errorEmployeeDetails && !employeeDetails) {
        return <div className="container mt-5"><div className="alert alert-danger">{errorEmployeeDetails}</div></div>;
    }

    // Ensure employeeDetails are loaded before rendering sections that depend on it
    const nhifNumber = employeeDetails?.nhifNo || 'N/A';
    const nssfNumber = employeeDetails?.nssfNo || 'N/A';
    const kraPin = employeeDetails?.kraPin || 'N/A';

    return (
        <div className="container mt-5">
            <h1 className="mb-4">My Benefits & Deductions Summary</h1>

            <div className="mb-3">
                <label htmlFor="year-select" className="form-label">Select Year for YTD Figures:</label>
                <select
                    id="year-select"
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{ maxWidth: '150px' }}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
            <hr />

            {/* Health Insurance Section */}
            <section className="mb-4">
                <h2>Health Insurance</h2>
                <div className="card">
                    <div className="card-body">
                        <p><strong>NHIF Number:</strong> {loadingEmployeeDetails ? 'Loading...' : nhifNumber}</p>
                        <p>The National Hospital Insurance Fund (NHIF) is a statutory deduction that provides medical insurance cover to all its members and their declared dependents.</p>
                        <h5 className="mt-3">Company Private Health Scheme</h5>
                        <p>Details about your company-provided private health insurance scheme will be available here if applicable.</p>
                    </div>
                </div>
            </section>

            {/* Retirement Plans Section */}
            <section className="mb-4">
                <h2>Retirement Plans</h2>
                <div className="card">
                    <div className="card-body">
                        <p><strong>NSSF Number:</strong> {loadingEmployeeDetails ? 'Loading...' : nssfNumber}</p>
                        <p>The National Social Security Fund (NSSF) is a statutory deduction aimed at providing basic financial security benefits to Kenyans upon retirement.</p>
                        <h5 className="mt-3">Year-to-Date (YTD) NSSF Contributions ({selectedYear})</h5>
                        {loadingFinancialSummary && <p>Loading NSSF summary...</p>}
                        {errorFinancialSummary && <p className="text-danger">{errorFinancialSummary}</p>}
                        {financialSummary && !loadingFinancialSummary && (
                            <p>{formatCurrency(financialSummary.ytdNSSFContributions)}</p>
                        )}
                        {!financialSummary && !loadingFinancialSummary && !errorFinancialSummary && <p>N/A</p>}
                    </div>
                </div>
            </section>

            {/* Other Deductions Section */}
            <section className="mb-4">
                <h2>Other Deductions & Contributions</h2>
                <div className="card">
                    <div className="card-body">
                        <p><strong>KRA PIN:</strong> {loadingEmployeeDetails ? 'Loading...' : kraPin}</p>
                        <p>Pay As You Earn (PAYE) is a method of tax deduction from employees' salaries or wages and is remitted to the Kenya Revenue Authority (KRA).</p>
                        <h5 className="mt-3">Year-to-Date (YTD) PAYE Contributions ({selectedYear})</h5>
                        {loadingFinancialSummary && <p>Loading PAYE summary...</p>}
                        {errorFinancialSummary && <p className="text-danger">{errorFinancialSummary}</p>}
                        {financialSummary && !loadingFinancialSummary && (
                            <p>{formatCurrency(financialSummary.ytdPAYE)}</p>
                        )}
                         {!financialSummary && !loadingFinancialSummary && !errorFinancialSummary && <p>N/A</p>}

                        <hr className="my-4"/>

                        <h4>Salary Advances</h4>
                        {loadingAdvances && <p>Loading advances information...</p>}
                        {errorAdvances && <p className="text-danger">{errorAdvances}</p>}
                        {!loadingAdvances && !errorAdvances && activeAdvances.length === 0 && (
                            <p>No active salary advances found.</p>
                        )}
                        {!loadingAdvances && !errorAdvances && activeAdvances.length > 0 && (
                            <ul className="list-group">
                                {activeAdvances.map(adv => (
                                    <li key={adv._id} className="list-group-item">
                                        Amount: {formatCurrency(adv.amount)}, Status: <span className={`badge bg-${adv.status === 'APPROVED' ? 'success' : (adv.status === 'PENDING' ? 'warning' : 'secondary')}`}>{adv.status}</span>, Date Issued: {new Date(adv.dateIssued).toLocaleDateString()}
                                        {adv.installments > 1 && <span>, Installments: {adv.installments}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BenefitsPage;
