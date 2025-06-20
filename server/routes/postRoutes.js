import express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import Post from '../mongodb/models/post.js';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per window
});

const router = express.Router();

// Apply the rate limiter to all requests in this router
router.use(limiter);

// GET ALL POSTS
router.route('/').get(async (req, res) => {
  try {
    console.log('Attempting to fetch all posts...');
    const posts = await Post.find({});
    console.log(`Successfully fetched ${posts.length} posts`);
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ success: false, message: 'Fetching posts failed, please try again', error: err.message });
  }
});

// CREATE A POST
// Helper function to check MongoDB connection
const ensureMongoConnected = async () => {
  // If we've already verified the connection is ready, we can skip this check
  if (global.mongooseConnected && global.mongooseConnection?.readyState === 1) {
    return true;
  }
  
  // Wait for connection to be ready if it's still connecting
  if (mongoose.connection.readyState === 2) {
    console.log('MongoDB connection in progress, waiting for it to complete...');
    return new Promise(resolve => {
      mongoose.connection.once('connected', () => {
        console.log('MongoDB connection now ready');
        global.mongooseConnected = true;
        resolve(true);
      });
    });
  }
  
  // If disconnected, log an error
  if (mongoose.connection.readyState === 0) {
    console.error('MongoDB connection not started - unable to perform database operations');
    return false;
  }
  
  return mongoose.connection.readyState === 1;
};

router.route('/').post(async (req, res) => {
  try {
    // 1. Ensure MongoDB is connected
    if (!(await ensureMongoConnected())) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected. Could not save post.',
      });
    }

    // 2. Get and validate input from request body
    const { name, prompt, photo } = req.body;
    if (!name || !prompt || !photo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, prompt, and photo.',
      });
    }

    // 3. Upload image to Cloudinary and create post in DB
    console.log('Uploading image to Cloudinary...');
    const photoUrl = await cloudinary.uploader.upload(photo);
    console.log('Image uploaded successfully to Cloudinary.');

    console.log('Creating new post in MongoDB...');
    const newPost = await Post.create({
      name,
      prompt,
      photo: photoUrl.secure_url, // Use the secure URL from Cloudinary
    });
    console.log('Post created successfully in MongoDB.');

    // 4. Send success response
    res.status(201).json({ success: true, data: newPost });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post. Please try again.',
      error: error.message,
    });
  }
});

export default router;
