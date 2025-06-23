const httpMocks = require('node-mocks-http');
const leaveController = require('./leaveController');
const Leave = require('../models/Leave');
const User = require('../models/User'); // User model might not be directly needed if req.user is pre-set
const Employee = require('../models/Employee'); // For checking if employee exists
const mongoose = require('mongoose');

// Mock the models
jest.mock('../models/Leave');
jest.mock('../models/Employee');
// jest.mock('../models/User'); // Only if User methods are directly called in controller

let req, res, next;

beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn(); // If you end up using a global error handler passed via next
});

describe('Leave Controller', () => {
    const mockEmployeeId = new mongoose.Types.ObjectId().toString();
    const mockUserId = new mongoose.Types.ObjectId().toString();

    describe('requestLeave', () => {
        beforeEach(() => {
            req.user = { _id: mockUserId, employeeId: mockEmployeeId, role: 'employee' };
            req.body = {
                startDate: '2024-01-15',
                endDate: '2024-01-20',
                reason: 'Vacation',
            };
            Employee.findById = jest.fn().mockResolvedValue({ _id: mockEmployeeId, name: 'Test Employee' });
            Leave.prototype.save = jest.fn().mockResolvedValue({ ...req.body, employeeId: mockEmployeeId, status: 'pending' });
        });

        it('should submit a leave request successfully', async () => {
            await leaveController.requestLeave(req, res);
            expect(res.statusCode).toBe(201);
            expect(res._getJSONData().message).toBe('Leave request submitted successfully.');
            expect(Leave.prototype.save).toHaveBeenCalled();
        });

        it('should return 400 if user has no employeeId', async () => {
            req.user.employeeId = null;
            await leaveController.requestLeave(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('User is not associated with an employee profile.');
        });

        it('should return 400 for missing fields', async () => {
            req.body.reason = '';
            await leaveController.requestLeave(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('Please provide start date, end date, and reason.');
        });

        it('should return 404 if employee profile not found', async () => {
            Employee.findById = jest.fn().mockResolvedValue(null);
            await leaveController.requestLeave(req, res);
            expect(res.statusCode).toBe(404);
            expect(res._getJSONData().message).toBe('Employee profile not found.');
        });

        it('should handle save errors (e.g., validation)', async () => {
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            Leave.prototype.save = jest.fn().mockRejectedValue(validationError);
            await leaveController.requestLeave(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('Validation failed');
        });

        it('should handle generic server errors during save', async () => {
            Leave.prototype.save = jest.fn().mockRejectedValue(new Error('Server error'));
            await leaveController.requestLeave(req, res);
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData().message).toBe('Server error while submitting leave request.');
        });
    });

    describe('getEmployeeLeaves', () => {
        beforeEach(() => {
            req.user = { _id: mockUserId, employeeId: mockEmployeeId, role: 'employee' };
            Leave.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
        });

        it('should fetch leaves for the logged-in employee', async () => {
            const mockLeaves = [{ reason: 'Test' }];
            Leave.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockLeaves) });
            await leaveController.getEmployeeLeaves(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual(mockLeaves);
            expect(Leave.find).toHaveBeenCalledWith({ employeeId: mockEmployeeId });
        });

        it('should return 400 if user has no employeeId', async () => {
            req.user.employeeId = null;
            await leaveController.getEmployeeLeaves(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('User is not associated with an employee profile.');
        });

        it('should handle server errors', async () => {
            Leave.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error("Server Error")) });
            await leaveController.getEmployeeLeaves(req, res);
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData().message).toBe('Server error while fetching leave requests.');
        });
    });

    describe('getAllLeaveRequests', () => {
        beforeEach(() => {
            req.user = { _id: mockUserId, role: 'hr_manager' }; // Or admin
            // Mocking the chained populate and sort
            const mockPopulateEmployee = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
            Leave.find = jest.fn().mockReturnValue(mockPopulateEmployee);
        });

        it('should fetch all leave requests for admin/hr', async () => {
            const mockLeaves = [{ reason: 'All Test' }];
            // Ensure the final call in the chain resolves to mockLeaves
            Leave.find().populate().sort.mockResolvedValue(mockLeaves);

            await leaveController.getAllLeaveRequests(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual(mockLeaves);
            expect(Leave.find).toHaveBeenCalledWith({});
            expect(Leave.find().populate).toHaveBeenCalledWith({
                path: 'employeeId',
                select: 'firstName lastName employeeNumber department'
            });
             expect(Leave.find().populate().populate).toHaveBeenCalledWith({
                path: 'processedBy',
                select: 'email role'
            });
            expect(Leave.find().populate().sort).toHaveBeenCalledWith({ createdAt: -1 });
        });

        it('should handle server errors', async () => {
            Leave.find().populate().sort.mockRejectedValue(new Error("Server Error"));
            await leaveController.getAllLeaveRequests(req, res);
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData().message).toBe('Server error while fetching all leave requests.');
        });
    });

    const leaveId = new mongoose.Types.ObjectId().toString();

    describe('approveLeave', () => {
        let mockLeaveInstance;
        beforeEach(() => {
            req.user = { _id: mockUserId, role: 'hr_manager' };
            req.params = { id: leaveId };

            mockLeaveInstance = {
                _id: leaveId,
                status: 'pending',
                save: jest.fn().mockResolvedValue(this) // 'this' refers to the mockLeaveInstance itself
            };
            Leave.findById = jest.fn().mockResolvedValue(mockLeaveInstance);
        });

        it('should approve a pending leave request', async () => {
            await leaveController.approveLeave(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData().message).toBe('Leave request approved successfully.');
            expect(mockLeaveInstance.status).toBe('approved');
            expect(mockLeaveInstance.processedBy.toString()).toBe(mockUserId);
            expect(mockLeaveInstance.save).toHaveBeenCalled();
        });

        it('should return 404 if leave request not found', async () => {
            Leave.findById = jest.fn().mockResolvedValue(null);
            await leaveController.approveLeave(req, res);
            expect(res.statusCode).toBe(404);
            expect(res._getJSONData().message).toBe('Leave request not found.');
        });

        it('should return 400 if leave request is not pending', async () => {
            mockLeaveInstance.status = 'approved';
            Leave.findById = jest.fn().mockResolvedValue(mockLeaveInstance);
            await leaveController.approveLeave(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('Leave request is already approved.');
        });

        it('should handle server errors during approval', async () => {
            mockLeaveInstance.save = jest.fn().mockRejectedValue(new Error("DB error"));
            Leave.findById = jest.fn().mockResolvedValue(mockLeaveInstance);
            await leaveController.approveLeave(req, res);
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData().message).toBe('Server error while approving leave request.');
        });
    });

    describe('rejectLeave', () => {
        let mockLeaveInstance;
        beforeEach(() => {
            req.user = { _id: mockUserId, role: 'hr_manager' };
            req.params = { id: leaveId };

            mockLeaveInstance = {
                _id: leaveId,
                status: 'pending',
                save: jest.fn().mockResolvedValue(this)
            };
            Leave.findById = jest.fn().mockResolvedValue(mockLeaveInstance);
        });

        it('should reject a pending leave request', async () => {
            await leaveController.rejectLeave(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData().message).toBe('Leave request rejected successfully.');
            expect(mockLeaveInstance.status).toBe('rejected');
            expect(mockLeaveInstance.processedBy.toString()).toBe(mockUserId);
            expect(mockLeaveInstance.save).toHaveBeenCalled();
        });

        it('should return 404 if leave request not found', async () => {
            Leave.findById = jest.fn().mockResolvedValue(null);
            await leaveController.rejectLeave(req, res);
            expect(res.statusCode).toBe(404);
            expect(res._getJSONData().message).toBe('Leave request not found.');
        });

        it('should return 400 if leave request is not pending', async () => {
            mockLeaveInstance.status = 'rejected';
            Leave.findById = jest.fn().mockResolvedValue(mockLeaveInstance);
            await leaveController.rejectLeave(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('Leave request is already rejected.');
        });

        it('should handle server errors during rejection', async () => {
            mockLeaveInstance.save = jest.fn().mockRejectedValue(new Error("DB error"));
            Leave.findById = jest.fn().mockResolvedValue(mockLeaveInstance);
            await leaveController.rejectLeave(req, res);
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData().message).toBe('Server error while rejecting leave request.');
        });
    });
});
