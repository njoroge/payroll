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
    bankName: '',
    accountNo: '',
    maritalStatus: '',
    incomeGradeId: '',
    departmentId: '',
    employmentStartDate: new Date().toISOString().split('T')[0],
    workStatus: 'ACTIVE',
    nextOfKin: {
        firstName: '',
        lastName: '',
        relation: '',
        phoneNo: '',
        email: ''
    },
    userEmail: '',
    userPassword: '',
    userRole: 'employee',
    createUserAccount: false,
};

const EmployeeForm = ({ isEditMode = false }) => {
    const { id: employeeId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormData);
    const [departments, setDepartments] = useState([]);
    const [incomeGrades, setIncomeGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formLoading, setFormLoading] = useState(isEditMode);

    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const [deptRes, gradeRes] = await Promise.all([
                    api.get('/departments'),
                    api.get('/income-grades')
                ]);
                setDepartments(deptRes.data.filter(d => d.status === 'ACTIVE'));
                setIncomeGrades(gradeRes.data.filter(g => g.isActive));
            } catch (err) {
                setError('Failed to load departments or income grades. Please ensure they are set up.');
                console.error(err);
            }
        };

        fetchPrerequisites();

        if (isEditMode && employeeId) {
            const fetchEmployee = async () => {
                try {
                    setFormLoading(true);
                    setError(''); // Clear previous errors
                    const { data } = await api.get(`/employees/${employeeId}`);
                    if (data.dob) data.dob = new Date(data.dob).toISOString().split('T')[0];
                    if (data.employmentStartDate) data.employmentStartDate = new Date(data.employmentStartDate).toISOString().split('T')[0];

                    setFormData({
                        ...initialFormData,
                        ...data,
                        nextOfKin: data.nextOfKin ? { ...initialFormData.nextOfKin, ...data.nextOfKin } : initialFormData.nextOfKin,
                        userEmail: data.userId?.email || '',
                        userRole: data.userId?.role || 'employee',
                        createUserAccount: !!data.userId,
                    });
                } catch (err) {
                    setError('Failed to fetch employee data for editing.');
                    console.error(err);
                } finally {
                    setFormLoading(false);
                }
            };
            fetchEmployee();
        } else {
            setFormLoading(false); // Not edit mode, so no form loading needed
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

        if (formData.createUserAccount && !isEditMode && !formData.userPassword) {
            setError("Password is required when creating a user account.");
            setLoading(false);
            return;
        }

        const payload = { ...formData };
        if (!payload.createUserAccount && !isEditMode) { // Only delete if not creating and not in edit mode (where user might exist)
            delete payload.userEmail;
            delete payload.userPassword;
        } else if (!payload.createUserAccount && isEditMode && !payload.userId) { // If editing and unchecking create user for a user that doesn't exist
             delete payload.userEmail;
             delete payload.userPassword;
        }


        if (!payload.surname) delete payload.surname; // Remove optional empty strings
        if (payload.dob === '') delete payload.dob;

        try {
            if (isEditMode) {
                await api.put(`/employees/${employeeId}`, payload);
            } else {
                await api.post('/employees', payload);
            }
            navigate('/employees');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} employee.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading employee details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            <div className="row justify-content-center">
                <div className="col-lg-10 col-xl-9">
                    <div className="card shadow-sm">
                        <div className="card-header text-center">
                            <h2 className="mb-0">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                {error && <div className="alert alert-danger" role="alert">{error}</div>}

                                <fieldset className="mb-4">
                                    <legend className="fs-5 fw-semibold mb-3 border-bottom pb-2">Personal Details</legend>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="firstName" className="form-label">First Name:</label><input type="text" name="firstName" id="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="lastName" className="form-label">Last Name:</label><input type="text" name="lastName" id="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required /></div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="surname" className="form-label">Surname (Optional):</label><input type="text" name="surname" id="surname" className="form-control" value={formData.surname} onChange={handleChange} /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="nationalId" className="form-label">National ID:</label><input type="text" name="nationalId" id="nationalId" className="form-control" value={formData.nationalId} onChange={handleChange} required disabled={isEditMode} /></div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="phoneNo" className="form-label">Phone Number:</label><input type="tel" name="phoneNo" id="phoneNo" className="form-control" value={formData.phoneNo} onChange={handleChange} /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="personalEmail" className="form-label">Personal Email:</label><input type="email" name="personalEmail" id="personalEmail" className="form-control" value={formData.personalEmail} onChange={handleChange} /></div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4 mb-3"><label htmlFor="dob" className="form-label">Date of Birth:</label><input type="date" name="dob" id="dob" className="form-control" value={formData.dob} onChange={handleChange} /></div>
                                        <div className="col-md-4 mb-3"><label htmlFor="gender" className="form-label">Gender:</label><select name="gender" id="gender" className="form-select" value={formData.gender} onChange={handleChange}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                                        <div className="col-md-4 mb-3"><label htmlFor="maritalStatus" className="form-label">Marital Status:</label><input type="text" name="maritalStatus" id="maritalStatus" className="form-control" value={formData.maritalStatus} onChange={handleChange} /></div>
                                    </div>
                                </fieldset>

                                <fieldset className="mb-4">
                                    <legend className="fs-5 fw-semibold mb-3 border-bottom pb-2">Statutory & Bank Details</legend>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="kraPin" className="form-label">KRA PIN:</label><input type="text" name="kraPin" id="kraPin" className="form-control" value={formData.kraPin} onChange={handleChange} /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="nhifNo" className="form-label">NHIF No.:</label><input type="text" name="nhifNo" id="nhifNo" className="form-control" value={formData.nhifNo} onChange={handleChange} /></div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="nssfNo" className="form-label">NSSF No.:</label><input type="text" name="nssfNo" id="nssfNo" className="form-control" value={formData.nssfNo} onChange={handleChange} /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="bankName" className="form-label">Bank Name:</label><input type="text" name="bankName" id="bankName" className="form-control" value={formData.bankName} onChange={handleChange} /></div>
                                    </div>
                                    <div className="mb-3"><label htmlFor="accountNo" className="form-label">Account No.:</label><input type="text" name="accountNo" id="accountNo" className="form-control" value={formData.accountNo} onChange={handleChange} /></div>
                                </fieldset>

                                <fieldset className="mb-4">
                                    <legend className="fs-5 fw-semibold mb-3 border-bottom pb-2">Employment Details</legend>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="departmentId" className="form-label">Department:</label><select name="departmentId" id="departmentId" className="form-select" value={formData.departmentId} onChange={handleChange} required><option value="">Select Department</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="incomeGradeId" className="form-label">Income Grade:</label><select name="incomeGradeId" id="incomeGradeId" className="form-select" value={formData.incomeGradeId} onChange={handleChange} required><option value="">Select Income Grade</option>{incomeGrades.map(g => <option key={g._id} value={g._id}>{g.gradeName} (Kes {g.basicSalary})</option>)}</select></div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="employmentStartDate" className="form-label">Employment Start Date:</label><input type="date" name="employmentStartDate" id="employmentStartDate" className="form-control" value={formData.employmentStartDate} onChange={handleChange} required /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="workStatus" className="form-label">Work Status:</label><select name="workStatus" id="workStatus" className="form-select" value={formData.workStatus} onChange={handleChange}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ON_LEAVE">On Leave</option><option value="TERMINATED">Terminated</option></select></div>
                                    </div>
                                </fieldset>

                                <fieldset className="mb-4">
                                    <legend className="fs-5 fw-semibold mb-3 border-bottom pb-2">Next of Kin</legend>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="nextOfKin.firstName" className="form-label">First Name:</label><input type="text" name="nextOfKin.firstName" id="nextOfKin.firstName" className="form-control" value={formData.nextOfKin.firstName} onChange={handleChange} /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="nextOfKin.lastName" className="form-label">Last Name:</label><input type="text" name="nextOfKin.lastName" id="nextOfKin.lastName" className="form-control" value={formData.nextOfKin.lastName} onChange={handleChange} /></div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="nextOfKin.relation" className="form-label">Relation:</label><input type="text" name="nextOfKin.relation" id="nextOfKin.relation" className="form-control" value={formData.nextOfKin.relation} onChange={handleChange} /></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="nextOfKin.phoneNo" className="form-label">Phone:</label><input type="tel" name="nextOfKin.phoneNo" id="nextOfKin.phoneNo" className="form-control" value={formData.nextOfKin.phoneNo} onChange={handleChange} /></div>
                                    </div>
                                    <div className="mb-3"><label htmlFor="nextOfKin.email" className="form-label">Email:</label><input type="email" name="nextOfKin.email" id="nextOfKin.email" className="form-control" value={formData.nextOfKin.email} onChange={handleChange} /></div>
                                </fieldset>

                                {!isEditMode && (
                                     <fieldset className="mb-4">
                                        <legend className="fs-5 fw-semibold mb-3 border-bottom pb-2">User Account (for Employee Portal Login)</legend>
                                        <div className="mb-3 form-check"><input type="checkbox" name="createUserAccount" id="createUserAccount" className="form-check-input" checked={formData.createUserAccount} onChange={handleChange} /><label htmlFor="createUserAccount" className="form-check-label"> Create User Account?</label></div>
                                        {formData.createUserAccount && (
                                            <>
                                                <div className="mb-3"><label htmlFor="userEmail" className="form-label">Login Email:</label><input type="email" name="userEmail" id="userEmail" className="form-control" value={formData.userEmail} onChange={handleChange} required={formData.createUserAccount} /></div>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3"><label htmlFor="userPassword" className="form-label">Password:</label><input type="password" name="userPassword" id="userPassword" className="form-control" value={formData.userPassword} onChange={handleChange} required={formData.createUserAccount} minLength="6" /></div>
                                                    <div className="col-md-6 mb-3"><label htmlFor="userRole" className="form-label">Role:</label><select name="userRole" id="userRole" className="form-select" value={formData.userRole} onChange={handleChange}><option value="employee">Employee</option><option value="hr_manager">HR Manager</option><option value="employee_admin">Employee Admin</option></select></div>
                                                </div>
                                            </>
                                        )}
                                    </fieldset>
                                )}
                                <div className="card-footer bg-light text-end py-3"> {/* Added card-footer */}
                                    <button type="button" className="btn btn-outline-secondary btn-lg me-2" onClick={() => navigate('/employees')}>Cancel</button>
                                    <button type="submit" className="btn btn-success btn-lg" disabled={loading || formLoading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {isEditMode ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (isEditMode ? 'Save Changes' : 'Create Employee')}
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

export default EmployeeForm;
