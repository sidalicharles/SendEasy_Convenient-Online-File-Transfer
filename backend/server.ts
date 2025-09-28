import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { SERVER_CONFIG } from './config/constants';
import passport from './config/passport';

// Debug environment variables
console.log('Environment variables loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
});

const app = express();
// Middleware
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Serve static files from the React frontend app
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(REACT_BUILD_FOLDER));
app.use('/assets', express.static(path.join(REACT_BUILD_FOLDER, 'assets')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/files', require('./routes/fileTransfer').default);

if (process.env.STRIPE_SECRET_KEY) {
  import('./routes/webhook/stripeWebhook')
    .then(({ default: stripeWebhookRouter }) => {
      app.use('/api/stripe/webhook', stripeWebhookRouter);
    })
    .catch((err) => {
      console.error('Failed to load Stripe webhook routes:', err);
    });
  import('./routes/stripe')
    .then(({ default: stripeRouter }) => {
      app.use('/api/stripe', stripeRouter);
    })
    .catch((err) => {
      console.error('Failed to load Stripe routes:', err);
    });
}
// Important: Catch-all route to handle React Router paths
// This should always be before error handler
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

// Error handling middleware should be last
app.use(errorHandler as ErrorRequestHandler);

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server ready on port ${SERVER_CONFIG.PORT}`);
});

export default app;
