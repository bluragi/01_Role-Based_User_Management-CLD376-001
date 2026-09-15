const express = require('express');
const app = express();

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');

/*
All requests reach this service THROUGH the gateway, which has already
verified the JWT and that role === 'user', and forwards the caller's
identity via the x-user-email header. Client-facing paths:

GET http://localhost:4000/user/viewprofile
PUT http://localhost:4000/user/updateprofile   body: { "name": "...", "phone": 123 }
*/

// GET /user/viewprofile — view own profile only
app.get('/viewprofile', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        const user = await UserModel.findOne({ email }).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /user/updateprofile — update own profile only
app.put('/updateprofile', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        const { name, phone } = req.body;

        const updatedUser = await UserModel.findOneAndUpdate(
            { email },
            { $set: { name, phone } },
            { new: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "Profile updated", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(5004, () => console.log('User Service running on PORT: 5004'));
