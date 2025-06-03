const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Load .env variables

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex: true, // No longer needed for mongoose 6+
            // useFindAndModify: false // No longer needed for mongoose 6+
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
