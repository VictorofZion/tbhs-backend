const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const academicRoutes = require('./routes/academicRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const examRoutes = require('./routes/examRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const materialRoutes = require('./routes/materialRoutes');

const app = express();

app.set('trust proxy', 1);

// 1. CORS Configuration
const allowedOrigins = [
  'https://tbhschools.netlify.app',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle all preflight requests explicitly

// 2. Helmet Configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '10mb' }));

// 3. Rate Limiter (Explicitly skipping OPTIONS preflight)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: "Too many login attempts from this IP. Please try again after 15 minutes." }
});

app.use('/api/auth/login', authLimiter);

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/materials', materialRoutes);

app.get('/', (req, res) => {
  res.status(200).send('TBHS Secure API Gateway is active.');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TBHS Server running on port ${PORT}`);
});
