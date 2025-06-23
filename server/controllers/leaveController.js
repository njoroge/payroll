const Leave = require('../models/Leave');
const Employee = require('../models/Employee'); // Assuming Employee model exists for validation
const User = require('../models/User');

// @desc    Request leave
// @route   POST /api/leaves/request
// @access  Private (Employee)
exports.requestLeave = async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    const employeeId = req.user.employeeId; // Assuming employeeId is populated in req.user from User model

    if (!employeeId) {
        return res.status(400).json({ message: 'User is not associated with an employee profile.' });
    }

    if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'Please provide start date, end date, and reason.' });
    }

    try {
        // Optional: Check if employee exists (though req.user.employeeId should be valid)
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found.' });
        }

        const leave = new Leave({
            employeeId,
            startDate,
            endDate,
            reason,
            status: 'pending', // Default status
        });

        await leave.save();
        res.status(201).json({ message: 'Leave request submitted successfully.', leave });
    } catch (error) {
        console.error('Error requesting leave:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while submitting leave request.' });
    }
};

// @desc    Get leave requests for the logged-in employee
// @route   GET /api/leaves/my-requests
// @access  Private (Employee)
exports.getEmployeeLeaves = async (req, res) => {
    const employeeId = req.user.employeeId;

    if (!employeeId) {
        return res.status(400).json({ message: 'User is not associated with an employee profile.' });
    }

    try {
        const leaves = await Leave.find({ employeeId }).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        console.error('Error fetching employee leave requests:', error);
        res.status(500).json({ message: 'Server error while fetching leave requests.' });
    }
};

// @desc    Get all leave requests (for HR/Admin)
// @route   GET /api/leaves/all-requests
// @access  Private (HR/Admin)
exports.getAllLeaveRequests = async (req, res) => {
    try {
        // Populate employee details for easier display on the frontend
        const leaves = await Leave.find({})
            .populate({
                path: 'employeeId',
                select: 'firstName lastName employeeNumber department' // Adjust fields as needed
            })
            .populate({
                path: 'processedBy',
                select: 'email role' // Adjust fields as needed
            })
            .sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        console.error('Error fetching all leave requests:', error);
        res.status(500).json({ message: 'Server error while fetching all leave requests.' });
    }
};

// @desc    Approve a leave request
// @route   PUT /api/leaves/:id/approve
// @access  Private (HR/Admin)
exports.approveLeave = async (req, res) => {
    const { id } = req.params; // Leave request ID
    const processorUserId = req.user._id; // ID of the admin/HR user processing the request

    try {
        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found.' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ message: `Leave request is already ${leave.status}.` });
        }

        leave.status = 'approved';
        leave.processedBy = processorUserId;
        leave.processedAt = Date.now();
        await leave.save();

        // Optional: Send notification to employee
        res.status(200).json({ message: 'Leave request approved successfully.', leave });
    } catch (error) {
        console.error('Error approving leave request:', error);
        res.status(500).json({ message: 'Server error while approving leave request.' });
    }
};

// @desc    Reject a leave request
// @route   PUT /api/leaves/:id/reject
// @access  Private (HR/Admin)
exports.rejectLeave = async (req, res) => {
    const { id } = req.params; // Leave request ID
    const processorUserId = req.user._id; // ID of the admin/HR user processing the request
    // Optional: Add a reason for rejection from req.body
    // const { rejectionReason } = req.body;

    try {
        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found.' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ message: `Leave request is already ${leave.status}.` });
        }

        leave.status = 'rejected';
        leave.processedBy = processorUserId;
        leave.processedAt = Date.now();
        // if (rejectionReason) leave.rejectionReason = rejectionReason; // Add if you add this field to schema
        await leave.save();

        // Optional: Send notification to employee
        res.status(200).json({ message: 'Leave request rejected successfully.', leave });
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        res.status(500).json({ message: 'Server error while rejecting leave request.' });
    }
};
