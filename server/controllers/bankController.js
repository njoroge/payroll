const Bank = require('../models/Bank');

// @desc    Create a new bank
// @route   POST /api/banks
// @access  Private (CompanyAdmin) - Banks are usually global, but can be restricted
const createBank = async (req, res) => {
    const { name, code, status } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Bank name is required.' });
    }
    try {
        const bankExists = await Bank.findOne({ $or: [{ name }, { code }] });
        if (bankExists) {
            return res.status(400).json({ message: `Bank with this name or code already exists.` });
        }
        const bank = new Bank({ name, code, status: status || 'ACTIVE' });
        const savedBank = await bank.save();
        res.status(201).json(savedBank);
    } catch (error) {
        console.error('Create bank error:', error);
        res.status(500).json({ message: 'Server error creating bank.', error: error.message });
    }
};

// @desc    Get all banks
// @route   GET /api/banks
// @access  Private (Authenticated users - e.g. for dropdowns)
const getBanks = async (req, res) => {
    try {
        const banks = await Bank.find({ status: 'ACTIVE' }); // Often only active banks are needed
        res.json(banks);
    } catch (error) {
        console.error('Get banks error:', error);
        res.status(500).json({ message: 'Server error fetching banks.', error: error.message });
    }
};

// @desc    Update a bank
// @route   PUT /api/banks/:id
// @access  Private (CompanyAdmin)
const updateBank = async (req, res) => {
    const { name, code, status } = req.body;
    try {
        const bank = await Bank.findById(req.params.id);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        if (name && name !== bank.name) {
            const bankExists = await Bank.findOne({ name });
            if (bankExists && bankExists._id.toString() !== req.params.id) {
                 return res.status(400).json({ message: 'Another bank with this name already exists.' });
            }
            bank.name = name;
        }
        if (code && code !== bank.code) {
            const bankExists = await Bank.findOne({ code });
            if (bankExists && bankExists._id.toString() !== req.params.id) {
                 return res.status(400).json({ message: 'Another bank with this code already exists.' });
            }
            bank.code = code;
        }
        if (status) bank.status = status;

        const updatedBank = await bank.save();
        res.json(updatedBank);
    } catch (error) {
        console.error('Update bank error:', error);
        res.status(500).json({ message: 'Server error updating bank.', error: error.message });
    }
};

module.exports = { createBank, getBanks, updateBank };
