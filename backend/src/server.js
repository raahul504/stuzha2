const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: { error: { message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // don't limit health checks
});

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const contentRoutes = require('./routes/contentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const videoRoutes = require('./routes/videoRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// ========== MIDDLEWARE ==========
// In Electron, the app is served from file:// so the origin header is either
// 'null' (string) or absent. We allow this in development alongside CLIENT_URL.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'null',          // Electron / file:// sends origin: 'null'
  'http://localhost:5173', // Vite dev server
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile, curl, Electron with no origin header)
    // or requests from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true, // Allow cookies
  exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition']
}));
app.use(helmet()); // Security headers
app.use(globalLimiter);
app.use(express.json());
// Raw body for Razorpay webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========== ROUTES ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LMS API is running' });
});

// TODO: Add route imports here
// app.use('/api/auth', authRoutes);
// app.use('/api/courses', courseRoutes);
// etc.

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', moduleRoutes);
app.use('/api', contentRoutes);
app.use('/api', progressRoutes);
app.use('/api', videoRoutes);
app.use('/api', certificateRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: { message: 'Route not found' }
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LMS API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});