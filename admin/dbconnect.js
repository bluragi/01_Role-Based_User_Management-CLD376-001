// STEP-1: IMPORT MONGOOSE PACKAGE
const mongoose = require('mongoose');
require('dotenv').config();

// STEP-2: Database connection URL comes from .env — never hardcode
// real credentials in a file that will be pushed to a public GitHub repo.
const uri = process.env.MONGO_URI;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
    try {
        await mongoose.connect(uri, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
    }
}
run();

// STEP-3: EXPORT MODULE so other files can use the same connection
module.exports = mongoose;
