const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON format

// Simple Route
app.get('/', (req, res) => {
    res.send('Payroll MERN API Running');
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/banks', require('./routes/bankRoutes'));
app.use('/api/income-grades', require('./routes/incomeGradeRoutes'));
app.use('/api/payroll-ops', require('./routes/payrollOperationsRoutes'));
app.use('/api/payrolls', require('./routes/payrollRoutes'));


// Error Handling Middleware (basic example)
// This should be defined AFTER all app.use() and routes
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    // Check if headers have already been sent
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).send('Something broke!');
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(\`Server running in \${process.env.NODE_ENV || 'development'} mode on port \${PORT}\`);
});
