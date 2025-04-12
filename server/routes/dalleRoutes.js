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

    // Use the current OpenAI SDK method
    const aiResponse = await openai.images.generate({
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    // Access the image data correctly
    const image = aiResponse.data[0].b64_json;
    res.status(200).json({ photo: image });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).send(error?.response?.data?.error?.message || 'Something went wrong');
  }
});

export default router;