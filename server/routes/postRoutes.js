import express from 'express';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import rateLimit from 'express-rate-limit'; // Import express-rate-limit

import Post from '../mongodb/models/post.js';

dotenv.config();

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per window
});

const router = express.Router();

// Apply the rate limiter to all requests in this router
router.use(limiter);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
router.route('/').post(async (req, res) => {
  try {
    console.log('Attempting to create a new post...');
    const { name, prompt, photo } = req.body;
    
    console.log('Uploading image to Cloudinary...');
    const photoUrl = await cloudinary.uploader.upload(photo, {
      fetch_format: 'auto',
      quality: 'auto',
      transformation: [
        { width: 1000, crop: "scale" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    });
    console.log('Image uploaded successfully:', photoUrl.url);

    console.log('Creating new post in MongoDB...');
    const newPost = await Post.create({
      name,
      prompt,
      photo: photoUrl.url,
    });
    console.log('Post created successfully with ID:', newPost._id);

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ success: false, message: 'Unable to create a post, please try again', error: err.message });
  }
});

export default router;
