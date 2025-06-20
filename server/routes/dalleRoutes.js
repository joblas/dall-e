import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E!' });
});

router.route('/').post(async (req, res) => {
  // Set headers to prevent CORS issues
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Log request information
    console.log('DALL-E API POST request received at:', new Date().toISOString());
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Empty request body received');
      return res.status(400).json({
        success: false,
        message: 'Empty request body. Please provide a prompt.'
      });
    }
    
    const { prompt } = req.body;
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('Invalid or missing prompt in request:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid prompt'
      });
    }
    
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing when handling request');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: API key missing'
      });
    }

    console.log('Generating image with prompt:', prompt);

    // Use the DALL-E 3 model
    const aiResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
      response_format: 'b64_json',
    });

    // Access the image data correctly
    const image = aiResponse.data[0].b64_json;
    console.log('Image generated successfully');
    res.status(200).json({ photo: image });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Log the full error for debugging
    try {
      console.log('Error details:', JSON.stringify(error, null, 2));
    } catch (e) {
      console.log('Error could not be stringified:', error.message);
    }
    
    // Check for specific billing error
    if (error.code === 'billing_hard_limit_reached' || 
        (error.error && error.error.code === 'billing_hard_limit_reached')) {
      return res.status(402).json({ 
        success: false, 
        message: 'OpenAI billing limit reached.'
      });
    }
    
    // Handle image generation user error
    if (error.type === 'image_generation_user_error') {
      console.log('Content policy violation detected in prompt: "' + prompt + '"');
      return res.status(400).json({ success: false, message: 'Your prompt may violate content policy. Please try a different prompt that avoids potentially sensitive or prohibited content.' });
    }
    
    // Always return JSON response, even for errors
    res.status(500).json({ 
      success: false, 
      message: 'Image generation failed'
    });
  }
});

export default router;