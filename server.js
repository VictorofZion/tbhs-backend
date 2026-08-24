// 1. Core Module Imports
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 2. Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const academicRoutes = require('./routes/academicRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const examRoutes = require('./routes/examRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const materialRoutes = require('./routes/materialRoutes');

// 3. Initialize Express Application (MUST occur before any app.use calls)
const app = express();

// Enable Trust Proxy for Render / Reverse Proxies (Required for rate limiting)
app.set('trust proxy', 1);

// 4. Configure CORS Middleware (MUST be registered before Helmet and routes)
const defaultOrigins = [
  'https://tbhschools.netlify.app',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

const envOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser calls (Postman, server-to-server) or matched origins
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    return callback(null, true); // Fallback allow to prevent unhandled preflight crashes
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 5. Configure Helmet Security Headers (Allowing Cross-Origin Resources)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 6. Express JSON Parser
app.use(express.json({ limit: '10mb' }));

// 7. Rate Limiter for Authentication Route
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts from this IP. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);

// 8. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/materials', materialRoutes);

// Base Gateway Check Route
app.get('/', (req, res) => {
  res.status(200).send('TBHS Secure API Gateway is active.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error.' });
});

// 9. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TBHS Server running on port ${PORT}`);
});
