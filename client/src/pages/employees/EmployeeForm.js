import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const initialFormData = {
    firstName: '',
    lastName: '',
    surname: '',
    nationalId: '',
    phoneNo: '',
    personalEmail: '',
    dob: '',
    gender: 'male',
    kraPin: '',
    nhifNo: '',
    nssfNo: '',
    bankName: '', // Or bankId if using Bank model ref
    accountNo: '',
    maritalStatus: '',
    incomeGradeId: '',
    departmentId: '',
    employmentStartDate: new Date().toISOString().split('T')[0], // Default to today
    workStatus: 'ACTIVE',
    nextOfKin: {
        firstName: '',
        lastName: '',
        relation: '',
        phoneNo: '',
        email: ''
    },
    // User account fields (optional, can be separate or conditional)
    userEmail: '',
    userPassword: '',
    userRole: 'employee', // Default role for new employee user
    createUserAccount: false,
};

const EmployeeForm = ({ isEditMode = false }) => {
    const { id: employeeId } = useParams(); // For edit mode
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormData);
    const [departments, setDepartments] = useState([]);
    const [incomeGrades, setIncomeGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formLoading, setFormLoading] = useState(isEditMode); // For fetching data in edit mode

    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const [deptRes, gradeRes] = await Promise.all([
                    api.get('/departments'), // Assuming this fetches for the current company
                    api.get('/income-grades') // Assuming this fetches for the current company
                ]);
                setDepartments(deptRes.data.filter(d => d.status === 'ACTIVE'));
                setIncomeGrades(gradeRes.data.filter(g => g.isActive));
            } catch (err) {
                setError('Failed to load departments or income grades.');
                console.error(err);
            }
        };

        fetchPrerequisites();

        if (isEditMode && employeeId) {
            const fetchEmployee = async () => {
                try {
                    setFormLoading(true);
                    const { data } = await api.get(`/employees/${employeeId}`);
                    // Format dates for input type="date"
                    if (data.dob) data.dob = new Date(data.dob).toISOString().split('T')[0];
                    if (data.employmentStartDate) data.employmentStartDate = new Date(data.employmentStartDate).toISOString().split('T')[0];

                    setFormData({
                        ...initialFormData, // Ensure all fields are present
                        ...data,
                        // Ensure nested objects are correctly spread or handled
                        nextOfKin: data.nextOfKin ? { ...initialFormData.nextOfKin, ...data.nextOfKin } : initialFormData.nextOfKin,
                        // User fields might not be directly on employee data or need separate handling
                        userEmail: data.userId?.email || '',
                        userRole: data.userId?.role || 'employee',
                        createUserAccount: !!data.userId, // Check if user account exists
                    });
                } catch (err) {
                    setError('Failed to fetch employee data for editing.');
                    console.error(err);
                } finally {
                    setFormLoading(false);
                }
            };
            fetchEmployee();
        }
    }, [isEditMode, employeeId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('nextOfKin.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                nextOfKin: { ...prev.nextOfKin, [field]: value }
            }));
        } else if (name === 'createUserAccount') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation for password if creating user account
        if (formData.createUserAccount && !isEditMode && !formData.userPassword) {
            setError("Password is required when creating a user account.");
            setLoading(false);
            return;
        }
        // In edit mode, password for user account update is more complex and usually handled separately

        const payload = { ...formData };
        if (!payload.createUserAccount) {
            delete payload.userEmail;
            delete payload.userPassword;
            // userRole might still be sent if we want to update an existing user's role
        }
        // Ensure empty strings for optional numbers are not sent, or handle in backend
        if (!payload.surname) delete payload.surname;
        if (payload.dob === '') delete payload.dob;


        try {
            if (isEditMode) {
                await api.put(`/employees/${employeeId}`, payload);
                // TODO: Handle user account update if email/role changed (might need specific endpoint)
            } else {
                await api.post('/employees', payload);
            }
            navigate('/employees'); // Redirect to list page after success
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} employee.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) return <p>Loading employee details...</p>;

    return (
        <div>
            <h2>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <fieldset><legend>Personal Details</legend>
                    <div><label>First Name: <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required /></label></div>
                    <div><label>Last Name: <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required /></label></div>
                    <div><label>Surname: <input type="text" name="surname" value={formData.surname} onChange={handleChange} /></label></div>
                    <div><label>National ID: <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} required disabled={isEditMode} /></label></div>
                    <div><label>Phone Number: <input type="tel" name="phoneNo" value={formData.phoneNo} onChange={handleChange} /></label></div>
                    <div><label>Personal Email: <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} /></label></div>
                    <div><label>Date of Birth: <input type="date" name="dob" value={formData.dob} onChange={handleChange} /></label></div>
                    <div><label>Gender:
                        <select name="gender" value={formData.gender} onChange={handleChange}>
                            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                        </select></label>
                    </div>
                    <div><label>Marital Status: <input type="text" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} /></label></div>
                </fieldset>

                <fieldset><legend>Statutory & Bank Details</legend>
                    <div><label>KRA PIN: <input type="text" name="kraPin" value={formData.kraPin} onChange={handleChange} /></label></div>
                    <div><label>NHIF No.: <input type="text" name="nhifNo" value={formData.nhifNo} onChange={handleChange} /></label></div>
                    <div><label>NSSF No.: <input type="text" name="nssfNo" value={formData.nssfNo} onChange={handleChange} /></label></div>
                    <div><label>Bank Name: <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} /></label></div> {/* TODO: Change to dropdown if Bank model is used */}
                    <div><label>Account No.: <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} /></label></div>
                </fieldset>

                <fieldset><legend>Employment Details</legend>
                    <div><label>Department:
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} required>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select></label>
                    </div>
                    <div><label>Income Grade:
                        <select name="incomeGradeId" value={formData.incomeGradeId} onChange={handleChange} required>
                            <option value="">Select Income Grade</option>
                            {incomeGrades.map(g => <option key={g._id} value={g._id}>{g.gradeName} (Kes {g.basicSalary})</option>)}
                        </select></label>
                    </div>
                    <div><label>Employment Start Date: <input type="date" name="employmentStartDate" value={formData.employmentStartDate} onChange={handleChange} required /></label></div>
                    <div><label>Work Status:
                        <select name="workStatus" value={formData.workStatus} onChange={handleChange}>
                            <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                            <option value="ON_LEAVE">On Leave</option><option value="TERMINATED">Terminated</option>
                        </select></label>
                    </div>
                </fieldset>

                <fieldset><legend>Next of Kin</legend>
                    <div><label>First Name: <input type="text" name="nextOfKin.firstName" value={formData.nextOfKin.firstName} onChange={handleChange} /></label></div>
                    <div><label>Last Name: <input type="text" name="nextOfKin.lastName" value={formData.nextOfKin.lastName} onChange={handleChange} /></label></div>
                    <div><label>Relation: <input type="text" name="nextOfKin.relation" value={formData.nextOfKin.relation} onChange={handleChange} /></label></div>
                    <div><label>Phone: <input type="tel" name="nextOfKin.phoneNo" value={formData.nextOfKin.phoneNo} onChange={handleChange} /></label></div>
                    <div><label>Email: <input type="email" name="nextOfKin.email" value={formData.nextOfKin.email} onChange={handleChange} /></label></div>
                </fieldset>

                {!isEditMode && ( // Only show user account creation for new employees
                     <fieldset><legend>User Account (for Employee Portal Login)</legend>
                        <div><label><input type="checkbox" name="createUserAccount" checked={formData.createUserAccount} onChange={handleChange} /> Create User Account?</label></div>
                        {formData.createUserAccount && (
                            <>
                                <div><label>Login Email: <input type="email" name="userEmail" value={formData.userEmail} onChange={handleChange} required={formData.createUserAccount} /></label></div>
                                <div><label>Password: <input type="password" name="userPassword" value={formData.userPassword} onChange={handleChange} required={formData.createUserAccount} minLength="6" /></label></div>
                                <div><label>Role:
                                    <select name="userRole" value={formData.userRole} onChange={handleChange}>
                                        <option value="employee">Employee</option>
                                        <option value="hr_manager">HR Manager</option> {/* Be cautious with assigning higher roles */}
                                        <option value="employee_admin">Employee Admin</option>
                                    </select></label>
                                </div>
                            </>
                        )}
                    </fieldset>
                )}
                {/* In Edit mode, user account update is more complex, might be a separate section or done via User Management */}


                <button type="submit" disabled={loading || formLoading}>
                    {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Employee')}
                </button>
                <button type="button" onClick={() => navigate('/employees')} style={{ marginLeft: '10px' }}>Cancel</button>
            </form>
        </div>
    );
};

export default EmployeeForm;
