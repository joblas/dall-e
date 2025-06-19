import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './mongodb/connect.js';
import postRoutes from './routes/postRoutes.js';
import dalleRoutes from './routes/dalleRoutes.js';

dotenv.config();

// Get the directory name using ES module syntax
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/v1/post', postRoutes);
app.use('/api/v1/dalle', dalleRoutes);

// Serve static files from the client's build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle API routes first
app.get('/api', async (req, res) => {
  res.status(200).json({
    message: 'Hello funboi from DALL.E! server',
  });
});

// For any other route, serve the React app
import rateLimit from 'express-rate-limit';

// Configure rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.get('*', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const startServer = async () => {
  try {
    console.log('Starting server...');
    
    // Check if MongoDB URL is defined
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is not defined in environment variables');
    }
    
    // Connect to MongoDB
    await connectDB(process.env.MONGODB_URL);
    
    // Define port
    const port = process.env.PORT || 8080;
    
    // Start listening
    app.listen(port, () => {
      console.log(`Server has started on port http://localhost:${port}`);
      console.log('API endpoints available:');
      console.log(`- GET /api/v1/post: Fetch all posts`);
      console.log(`- POST /api/v1/post: Create a new post`);
      console.log(`- GET /api/v1/dalle: DALL-E API info`);
      console.log(`- POST /api/v1/dalle: Generate an image with DALL-E`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Please check your environment variables and connections');
    process.exit(1); // Exit with error code
  }
};

startServer();
