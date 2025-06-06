import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { preview } from '../assets';
import { getRandomPrompt } from '../utils';
import { FormField, Loader } from '../components';

const CreatePost = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    prompt: '',
    photo: '',
  });

  const [generatingImg, setGeneratingImg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSurpriseMe = () => {
    const randomPrompt = getRandomPrompt(form.prompt);
    setForm({ ...form, prompt: randomPrompt });
  };

  const generateImage = async () => {
    if (form.prompt) {
      try {
        setGeneratingImg(true);
        setError('');
        
        console.log('Sending request to DALL-E API with prompt:', form.prompt);
        
        const response = await fetch('https://dall-e-zf26.onrender.com/api/v1/dalle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: form.prompt,
          }),
        });

        console.log('Response status:', response.status);
        
        // Get the response text first
        const responseText = await response.text();
        console.log('Response text:', responseText.substring(0, 100) + '...');
        
        // Try to parse the response text as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error('Failed to parse server response as JSON');
        }
        
        // Check for specific errors
        if (!response.ok) {
          // Check for billing limit error (HTTP 402 Payment Required)
          if (response.status === 402) {
            throw new Error('OpenAI billing limit reached: ' + (data.error || data.message));
          }
          
          throw new Error(data.error || data.message || `Server error: ${response.status}`);
        }
        
        if (!data || !data.photo) {
          console.error('Missing photo data in response:', data);
          throw new Error('No image data received from server');
        }
        
        console.log('Image data received successfully');
        setForm({ ...form, photo: `data:image/jpeg;base64,${data.photo}` });
      } catch (err) {
        console.error('Image generation error:', err);
        
        // Set a more user-friendly error message for billing issues
        if (err.message && err.message.includes('billing limit')) {
          setError('The OpenAI account has reached its billing limit. Please contact the administrator to update the payment information.');
        } else {
          setError(err.message || 'Something went wrong while generating the image');
        }
        
        alert(err.message || 'Something went wrong while generating the image');
      } finally {
        setGeneratingImg(false);
      }
    } else {
      setError('Please provide a prompt');
      alert('Please provide proper prompt');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.prompt && form.photo) {
      setLoading(true);
      setError('');
      try {
        console.log('Submitting post with data:', {
          name: form.name,
          prompt: form.prompt,
          photoLength: form.photo ? form.photo.length : 0,
        });
        
        const response = await fetch('https://dall-e-zf26.onrender.com/api/v1/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...form }),
        });

        console.log('Post response status:', response.status);
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response error:', response.status, errorText);
          throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        await response.json();
        console.log('Post shared successfully');
        alert('Success');
        navigate('/');
      } catch (err) {
        console.error('Post submission error:', err);
        setError(err.message || 'Something went wrong while sharing your post');
        alert(err.message || 'Something went wrong while sharing your post');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please generate an image with proper details');
      alert('Please generate an image with proper details');
    }
  };

  return (
    <section className="max-w-7xl mx-auto">
      <div>
        <h1 className="font-extrabold text-text-primary dark:text-text-primary-dark text-[32px] sm:text-[40px] transition-colors duration-200">Create</h1>
        <p className="mt-2 text-text-secondary dark:text-text-secondary-dark text-[14px] max-w-[500px] transition-colors duration-200">
          Below enter your name then add some descriptive prompts and let DALL-E AI do magic. Share it with the community when satisfied with the image
        </p>
      </div>

      <form className="mt-16 max-w-3xl" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5">
          <FormField
            labelName="Your Name or Alias"
            type="text"
            name="name"
            placeholder="Ex., Ram Bo"
            value={form.name}
            handleChange={handleChange}
          />

          <FormField
            labelName="Prompt"
            type="text"
            name="prompt"
            placeholder="An Impressionist oil painting of sunflowers in a purple vase…"
            value={form.prompt}
            handleChange={handleChange}
            isSurpriseMe
            handleSurpriseMe={handleSurpriseMe}
          />

          <div className="relative bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary w-64 p-3 h-64 flex justify-center items-center transition-colors duration-200 sm:w-96 sm:h-96">
            { form.photo ? (
              <img
                src={form.photo}
                alt={form.prompt}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="w-9/12 h-9/12 object-contain opacity-40"
              />
            )}

            {generatingImg && (
              <div className="absolute inset-0 z-0 flex justify-center items-center bg-[rgba(0,0,0,0.5)] rounded-lg">
                <Loader />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-red-500 dark:text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateImage}
            className="text-white bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 font-medium rounded-md text-sm px-5 py-2.5 text-center transition-colors duration-200 shadow-sm hover:shadow-md"
            disabled={generatingImg}
          >
            {generatingImg ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="mt-10">
          <p className="mt-2 text-text-secondary dark:text-text-secondary-dark text-[14px] transition-colors duration-200">
            ** Once you have created the image you want, you can share it with others in the community **
          </p>
          <button
            type="submit"
            className="mt-3 text-white bg-primary hover:bg-primary-dark font-medium rounded-md text-sm px-5 py-2.5 text-center transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !form.prompt || !form.photo || !form.name}
          >
            {loading ? 'Sharing...' : 'Share with the Community'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreatePost;