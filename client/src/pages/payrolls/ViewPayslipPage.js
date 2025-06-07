import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const ViewPayslipPage = () => {
    const { id: payslipId } = useParams();
    const [payslip, setPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const payslipRef = useRef();

    useEffect(() => {
        const fetchPayslip = async () => {
            try {
                setLoading(true); setError('');
                const { data } = await api.get(`/payrolls/${payslipId}`);
                setPayslip(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch payslip details.');
                console.error(err);
            } finally { setLoading(false); }
        };
        if (payslipId) {
            fetchPayslip();
        }
    }, [payslipId]);

    const handlePrint = () => {
        const printContents = payslipRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    if (loading) return <p>Loading payslip...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!payslip) return <p>Payslip not found.</p>;

    const { employeeId: emp, companyId: comp, incomeGradeSnapshot: igs } = payslip;

    return (
        <div>
            <button onClick={handlePrint} style={{ float: 'right', marginBottom: '1rem' }}>Print Payslip</button>
            <h2>Payslip for {emp?.firstName} {emp?.lastName}</h2>
            <div ref={payslipRef} style={{padding: '20px', border: '1px solid #ccc'}}>
                <h3 style={{textAlign: 'center'}}>{comp?.name || 'Company Name'}</h3>
                <p style={{textAlign: 'center'}}>{comp?.location || 'Company Address'}</p>
                <p style={{textAlign: 'center'}}>Tax PIN: {comp?.taxPin || 'N/A'}</p>
                <hr/>
                <h4>Payslip for {payslip.month}, {payslip.year}</h4>
                <p><strong>Employee Name:</strong> {emp?.firstName} {emp?.lastName}</p>
                <p><strong>National ID:</strong> {emp?.nationalId}</p>
                <p><strong>Department:</strong> {emp?.departmentId?.name || 'N/A'}</p>
                <p><strong>Income Grade:</strong> {igs?.gradeName || 'N/A'}</p>
                <p><strong>Date Processed:</strong> {new Date(payslip.processingDate).toLocaleDateString()}</p>
                <hr/>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr><th style={{textAlign: 'left'}}>Earnings</th><th style={{textAlign: 'right'}}>Amount (KES)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Basic Salary</td><td style={{textAlign: 'right'}}>{igs?.basicSalary?.toFixed(2)}</td></tr>
                        <tr><td>House Allowance</td><td style={{textAlign: 'right'}}>{igs?.houseAllowance?.toFixed(2)}</td></tr>
                        <tr><td>Transport Allowance</td><td style={{textAlign: 'right'}}>{igs?.transportAllowance?.toFixed(2)}</td></tr>
                        {igs?.hardshipAllowance > 0 && <tr><td>Hardship Allowance</td><td style={{textAlign: 'right'}}>{igs?.hardshipAllowance?.toFixed(2)}</td></tr>}
                        {igs?.specialAllowance > 0 && <tr><td>Special Allowance</td><td style={{textAlign: 'right'}}>{igs?.specialAllowance?.toFixed(2)}</td></tr>}
                        {payslip.reimbursementAdded > 0 && <tr><td>Reimbursements</td><td style={{textAlign: 'right'}}>{payslip.reimbursementAdded?.toFixed(2)}</td></tr>}
                        <tr><td style={{fontWeight: 'bold'}}>Gross Earnings</td><td style={{textAlign: 'right', fontWeight: 'bold'}}>{(payslip.grossEarnings + payslip.reimbursementAdded)?.toFixed(2)}</td></tr>
                    </tbody>
                </table>
                <hr/>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                     <thead>
                        <tr><th style={{textAlign: 'left'}}>Deductions</th><th style={{textAlign: 'right'}}>Amount (KES)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>PAYE (Tax)</td><td style={{textAlign: 'right'}}>{payslip.paye?.toFixed(2)}</td></tr>
                        <tr><td>NHIF</td><td style={{textAlign: 'right'}}>{payslip.nhifDeduction?.toFixed(2)}</td></tr>
                        <tr><td>NSSF</td><td style={{textAlign: 'right'}}>{payslip.nssfDeduction?.toFixed(2)}</td></tr>
                        {payslip.advanceDeducted > 0 && <tr><td>Advance Deduction</td><td style={{textAlign: 'right'}}>{payslip.advanceDeducted?.toFixed(2)}</td></tr>}
                        {payslip.damageDeducted > 0 && <tr><td>Damage Deduction</td><td style={{textAlign: 'right'}}>{payslip.damageDeducted?.toFixed(2)}</td></tr>}
                        <tr><td style={{fontWeight: 'bold'}}>Total Deductions</td><td style={{textAlign: 'right', fontWeight: 'bold'}}>{payslip.totalDeductions?.toFixed(2)}</td></tr>
                    </tbody>
                </table>
                <hr/>
                <h4 style={{textAlign: 'right'}}>Net Pay: KES {payslip.netPay?.toFixed(2)}</h4>
                <p><strong>Status:</strong> {payslip.status}</p>
                {payslip.notes && <p><strong>Notes:</strong> {payslip.notes}</p>}
            </div>
            <Link to="/payrolls" style={{marginTop: '1rem', display: 'block'}}>Back to Payroll List</Link>
        </div>
    );
};
export default ViewPayslipPage;
