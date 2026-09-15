const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');

/*
Client hits this THROUGH the gateway at:
POST http://localhost:4000/register/userregister

Body:
{
  "name": "Natalie",
  "email": "natalie@gmail.com",
  "password": "abc123",
  "phone": 12345678,
  "role": "user"
}
*/

app.post('/userregister', async (req, res) => {
    console.log("REGISTER API EXECUTED");
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "name, email, password, and role are required" });
        }

        // Task 5: Email must be unique
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        // Task 5: Password must never be stored as plain text
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            phone,
            role
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Error registering user" });
    }
});

app.listen(5001, () => console.log('Registration Service running on PORT: 5001'));
