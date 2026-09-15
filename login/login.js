const express = require('express');
const app = express();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');

const JWT_SECRET = process.env.JWT_SECRET;

/*
Client hits this THROUGH the gateway at:
POST http://localhost:4000/auth/login

Body:
{
  "email": "natalie@gmail.com",
  "password": "abc123",
  "role": "user"
}
*/

app.post("/login", async (req, res) => {
    console.log("LOGIN API EXECUTED");
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "email, password, and role are required" });
        }

        // Validate email + role together against the database
        const user = await UserModel.findOne({ email, role });
        if (!user) {
            return res.status(400).json({ message: "Invalid email, password, or role" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Invalid email, password, or role" });
        }

        const token = jwt.sign(
            { email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({ token });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Login error" });
    }
});

app.listen(5002, () => {
    console.log('Authentication Service Server is running on PORT NO: 5002');
});
