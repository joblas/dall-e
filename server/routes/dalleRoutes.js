import express from 'express';
import * as dotenv from 'dotenv';
import { OpenAIApi, Configuration } from 'openai';

dotenv.config();

const router = express.Router();

// Initialize OpenAI with the correct configuration
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E! ON the Render.com server' });
});

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    // Corrected method call to match OpenAI SDK
    const aiResponse = await openai.createImage({
      prompt,
      n: 1,
      size: '1024x1024',
    });

    // Corrected access to the image data
    const image = aiResponse.data.data[0].url;
    res.status(200).json({ photo: image });
  } catch (error) {
    console.log(error);
    res.status(500).send(error?.response?.data?.error?.message || 'Something went wrong');
  }
});

export default router;