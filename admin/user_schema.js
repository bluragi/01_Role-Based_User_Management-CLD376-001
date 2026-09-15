const mongoose = require('mongoose');

// Matches the model shape required by the assignment:
// { _id, name, email, password, role, phone, createdAt, updatedAt }
const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: Number },
        role: { type: String, required: true, enum: ['user', 'admin'] }
    },
    {
        timestamps: true // adds createdAt and updatedAt automatically
    }
);

module.exports = mongoose.model('User', UserSchema);
