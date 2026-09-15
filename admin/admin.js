const express = require('express');
const app = express();

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');

/*
All requests reach this service THROUGH the gateway, which has already
verified the JWT and that role === 'admin'. Client-facing paths:

GET    http://localhost:4000/admin/searchuser?query=natalie
GET    http://localhost:4000/admin/viewalluser
DELETE http://localhost:4000/admin/deluser   body: { "email": "natalie@gmail.com" }
*/

// GET /admin/searchuser — search by name OR email
app.get('/searchuser', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Provide a 'query' parameter" });
        }

        const users = await UserModel.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');

        if (users.length === 0) {
            return res.status(404).json({ message: "No matching user found" });
        }
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /admin/viewalluser — view all users
app.get('/viewalluser', async (req, res) => {
    try {
        const users = await UserModel.find().select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /admin/deluser — delete a user by email
app.delete('/deluser', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "email is required" });
        }

        const deletedUser = await UserModel.findOneAndDelete({ email });
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(5003, () => console.log('Admin Service running on PORT: 5003'));
