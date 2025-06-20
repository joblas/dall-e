import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import connectDB from './mongodb/connect.js';
import postRoutes from './routes/postRoutes.js';
import dalleRoutes from './routes/dalleRoutes.js';

// Setup paths and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// API Routes
app.use('/api/v1', limiter);
app.use('/api/v1/post', postRoutes);
app.use('/api/v1/dalle', dalleRoutes);

// Static Files for Frontend
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start Server
const startServer = async () => {
  const port = process.env.PORT || 8081;
  app.listen(port, () => {
    console.log(`Server has started on port http://localhost:${port}`);
  });

  try {
    // Process MongoDB URL to strip prefix if present
    let mongoUrl = process.env.MONGODB_URL;
    
    if (mongoUrl) {
      // Check for and strip the 'MONGODB_URL=' prefix if it exists
      if (mongoUrl.startsWith('MONGODB_URL=')) {
        console.warn('WARNING: Detected "MONGODB_URL=" prefix in the MONGODB_URL environment variable. Stripping it.');
        mongoUrl = mongoUrl.substring('MONGODB_URL='.length);
      }
      
      // Ensure URL starts with mongodb:// or mongodb+srv://
      if (!mongoUrl.startsWith('mongodb://') && !mongoUrl.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MongoDB URL format. Must start with mongodb:// or mongodb+srv://');
      }
    }
    
    await connectDB(mongoUrl);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
};

startServer();
