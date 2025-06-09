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
                    <div className="mb-3"><label htmlFor="firstName" className="form-label">First Name: </label><input type="text" name="firstName" id="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required /></div>
                    <div className="mb-3"><label htmlFor="lastName" className="form-label">Last Name: </label><input type="text" name="lastName" id="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required /></div>
                    <div className="mb-3"><label htmlFor="surname" className="form-label">Surname: </label><input type="text" name="surname" id="surname" className="form-control" value={formData.surname} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nationalId" className="form-label">National ID: </label><input type="text" name="nationalId" id="nationalId" className="form-control" value={formData.nationalId} onChange={handleChange} required disabled={isEditMode} /></div>
                    <div className="mb-3"><label htmlFor="phoneNo" className="form-label">Phone Number: </label><input type="tel" name="phoneNo" id="phoneNo" className="form-control" value={formData.phoneNo} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="personalEmail" className="form-label">Personal Email: </label><input type="email" name="personalEmail" id="personalEmail" className="form-control" value={formData.personalEmail} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="dob" className="form-label">Date of Birth: </label><input type="date" name="dob" id="dob" className="form-control" value={formData.dob} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="gender" className="form-label">Gender:</label>
                        <select name="gender" id="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                        </select>
                    </div>
                    <div className="mb-3"><label htmlFor="maritalStatus" className="form-label">Marital Status: </label><input type="text" name="maritalStatus" id="maritalStatus" className="form-control" value={formData.maritalStatus} onChange={handleChange} /></div>
                </fieldset>

                <fieldset><legend>Statutory & Bank Details</legend>
                    <div className="mb-3"><label htmlFor="kraPin" className="form-label">KRA PIN: </label><input type="text" name="kraPin" id="kraPin" className="form-control" value={formData.kraPin} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nhifNo" className="form-label">NHIF No.: </label><input type="text" name="nhifNo" id="nhifNo" className="form-control" value={formData.nhifNo} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nssfNo" className="form-label">NSSF No.: </label><input type="text" name="nssfNo" id="nssfNo" className="form-control" value={formData.nssfNo} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="bankName" className="form-label">Bank Name: </label><input type="text" name="bankName" id="bankName" className="form-control" value={formData.bankName} onChange={handleChange} /></div> {/* TODO: Change to dropdown if Bank model is used */}
                    <div className="mb-3"><label htmlFor="accountNo" className="form-label">Account No.: </label><input type="text" name="accountNo" id="accountNo" className="form-control" value={formData.accountNo} onChange={handleChange} /></div>
                </fieldset>

                <fieldset><legend>Employment Details</legend>
                    <div className="mb-3"><label htmlFor="departmentId" className="form-label">Department:</label>
                        <select name="departmentId" id="departmentId" className="form-select" value={formData.departmentId} onChange={handleChange} required>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-3"><label htmlFor="incomeGradeId" className="form-label">Income Grade:</label>
                        <select name="incomeGradeId" id="incomeGradeId" className="form-select" value={formData.incomeGradeId} onChange={handleChange} required>
                            <option value="">Select Income Grade</option>
                            {incomeGrades.map(g => <option key={g._id} value={g._id}>{g.gradeName} (Kes {g.basicSalary})</option>)}
                        </select>
                    </div>
                    <div className="mb-3"><label htmlFor="employmentStartDate" className="form-label">Employment Start Date: </label><input type="date" name="employmentStartDate" id="employmentStartDate" className="form-control" value={formData.employmentStartDate} onChange={handleChange} required /></div>
                    <div className="mb-3"><label htmlFor="workStatus" className="form-label">Work Status:</label>
                        <select name="workStatus" id="workStatus" className="form-select" value={formData.workStatus} onChange={handleChange}>
                            <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                            <option value="ON_LEAVE">On Leave</option><option value="TERMINATED">Terminated</option>
                        </select>
                    </div>
                </fieldset>

                <fieldset><legend>Next of Kin</legend>
                    <div className="mb-3"><label htmlFor="nextOfKin.firstName" className="form-label">First Name: </label><input type="text" name="nextOfKin.firstName" id="nextOfKin.firstName" className="form-control" value={formData.nextOfKin.firstName} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nextOfKin.lastName" className="form-label">Last Name: </label><input type="text" name="nextOfKin.lastName" id="nextOfKin.lastName" className="form-control" value={formData.nextOfKin.lastName} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nextOfKin.relation" className="form-label">Relation: </label><input type="text" name="nextOfKin.relation" id="nextOfKin.relation" className="form-control" value={formData.nextOfKin.relation} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nextOfKin.phoneNo" className="form-label">Phone: </label><input type="tel" name="nextOfKin.phoneNo" id="nextOfKin.phoneNo" className="form-control" value={formData.nextOfKin.phoneNo} onChange={handleChange} /></div>
                    <div className="mb-3"><label htmlFor="nextOfKin.email" className="form-label">Email: </label><input type="email" name="nextOfKin.email" id="nextOfKin.email" className="form-control" value={formData.nextOfKin.email} onChange={handleChange} /></div>
                </fieldset>

                {!isEditMode && ( // Only show user account creation for new employees
                     <fieldset><legend>User Account (for Employee Portal Login)</legend>
                        <div className="mb-3 form-check">
                            <input type="checkbox" name="createUserAccount" id="createUserAccount" className="form-check-input" checked={formData.createUserAccount} onChange={handleChange} />
                            <label htmlFor="createUserAccount" className="form-check-label"> Create User Account?</label>
                        </div>
                        {formData.createUserAccount && (
                            <>
                                <div className="mb-3"><label htmlFor="userEmail" className="form-label">Login Email: </label><input type="email" name="userEmail" id="userEmail" className="form-control" value={formData.userEmail} onChange={handleChange} required={formData.createUserAccount} /></div>
                                <div className="mb-3"><label htmlFor="userPassword" className="form-label">Password: </label><input type="password" name="userPassword" id="userPassword" className="form-control" value={formData.userPassword} onChange={handleChange} required={formData.createUserAccount} minLength="6" /></div>
                                <div className="mb-3"><label htmlFor="userRole" className="form-label">Role:</label>
                                    <select name="userRole" id="userRole" className="form-select" value={formData.userRole} onChange={handleChange}>
                                        <option value="employee">Employee</option>
                                        <option value="hr_manager">HR Manager</option> {/* Be cautious with assigning higher roles */}
                                        <option value="employee_admin">Employee Admin</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </fieldset>
                )}
                {/* In Edit mode, user account update is more complex, might be a separate section or done via User Management */}


                <button type="submit" className="btn btn-success" disabled={loading || formLoading}>
                    {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Employee')}
                </button>
                <button type="button" className="btn btn-success" onClick={() => navigate('/employees')} style={{ marginLeft: '10px' }}>Cancel</button>
            </form>
        </div>
    );
};

export default EmployeeForm;
