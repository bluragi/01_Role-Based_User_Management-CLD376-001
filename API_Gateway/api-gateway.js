const express = require('express');
const app = express();

// USE PROXY SERVER TO REDIRECT THE INCOMING REQUEST
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// Service locations — on EC2 these point at OTHER instances' public IPs.
// Locally they default back to localhost so nothing breaks in dev.
const REGISTER_SERVICE_URL = process.env.REGISTER_SERVICE_URL || 'http://localhost:5001';
const LOGIN_SERVICE_URL = process.env.LOGIN_SERVICE_URL || 'http://localhost:5002';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:5003';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5004';

function authToken(req, res, next) {
    const header = req?.headers.authorization;
    const token = header && header.split(' ')[1];

    if (token == null) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: "Token expired" });
            }
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = user;
        // Forward identity to the downstream microservice via headers,
        // since http-proxy does not forward req.user automatically.
        req.headers['x-user-email'] = user.email;
        req.headers['x-user-role'] = user.role;
        next();
    });
}

function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Unauthorized: insufficient role" });
        }
        next();
    };
}

// PUBLIC ROUTES — no token required (registering and logging in)
// app.use('/register', (req, res) => {
//     console.log("GATEWAY -> REGISTER SERVICE");
//     proxy.web(req, res, { target: 'http://localhost:5001' });
// });

// app.use('/auth', (req, res) => {
//     console.log("GATEWAY -> LOGIN SERVICE");
//     proxy.web(req, res, { target: 'http://localhost:5002' });
// });

// PROTECTED ROUTES — token + role required
// app.use('/admin', authToken, authRole('admin'), (req, res) => {
//     console.log("GATEWAY -> ADMIN SERVICE");
//     proxy.web(req, res, { target: 'http://localhost:5003' });
// });

// app.use('/user', authToken, authRole('user'), (req, res) => {
//     console.log("GATEWAY -> USER SERVICE");
//     proxy.web(req, res, { target: 'http://localhost:5004' });
// });

// proxy.on('error', (err, req, res) => {
//     console.error('Proxy error:', err.message);
//     res.status(502).json({ message: 'Downstream service unavailable' });
// });

// app.listen(4000, () => {
//     console.log("API Gateway Service is running on PORT NO : 4000");
// });

// PUBLIC ROUTES — no token required (registering and logging in)
app.use('/register', (req, res) => {
    console.log("GATEWAY -> REGISTER SERVICE");
    proxy.web(req, res, { target: REGISTER_SERVICE_URL });
});

app.use('/auth', (req, res) => {
    console.log("GATEWAY -> LOGIN SERVICE");
    proxy.web(req, res, { target: LOGIN_SERVICE_URL });
});

// PROTECTED ROUTES — token + role required
app.use('/admin', authToken, authRole('admin'), (req, res) => {
    console.log("GATEWAY -> ADMIN SERVICE");
    proxy.web(req, res, { target: ADMIN_SERVICE_URL });
});

app.use('/user', authToken, authRole('user'), (req, res) => {
    console.log("GATEWAY -> USER SERVICE");
    proxy.web(req, res, { target: USER_SERVICE_URL });
});

proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({ message: 'Downstream service unavailable' });
});

app.listen(4000, () => {
    console.log("API Gateway Service is running on PORT NO : 4000");
});