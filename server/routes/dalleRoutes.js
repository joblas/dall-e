import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const router = express.Router();

// Initialize OpenAI with the correct configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E!' });
});

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log('Generating image with prompt:', prompt);

    // Use the current OpenAI SDK method
    const aiResponse = await openai.images.generate({
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    // Access the image data correctly
    const image = aiResponse.data[0].b64_json;
    console.log('Image generated successfully');
    res.status(200).json({ photo: image });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Check for specific billing error
    if (error.code === 'billing_hard_limit_reached' || 
        (error.error && error.error.code === 'billing_hard_limit_reached')) {
      return res.status(402).json({ 
        success: false, 
        message: 'OpenAI billing limit reached. Please check your OpenAI account.',
        error: 'The API key has reached its billing limit. Please update your payment information in your OpenAI account.'
      });
    }
    
    // Always return JSON response, even for errors
    res.status(500).json({ 
      success: false, 
      message: 'Image generation failed',
      error: error?.response?.data?.error?.message || error.message || 'Something went wrong'
    });
  }
});

export default router;