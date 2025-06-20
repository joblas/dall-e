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
    console.log('Generate button handler triggered');
    if (form.prompt) {
      console.log('Generate button clicked, generating image with prompt:', form.prompt);
      try {
        setGeneratingImg(true);
        setError('');
        
        console.log('Sending request to DALL-E API with prompt:', form.prompt);
        
        // Log API details for debugging
        console.log('API URL:', 'http://localhost:8081/api/v1/dalle');
        
        const response = await fetch('http://localhost:8081/api/v1/dalle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: form.prompt,
          }),
          // Ensure no cached result
          cache: 'no-cache',
        });

        console.log('Response status:', response.status);
        
        // Check for error status codes immediately
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: 'Failed to parse error response'
          }));
          
          console.log('Error response:', errorData);
          
          if (response.status === 400 && errorData.message && errorData.message.includes('content policy')) {
            setError(errorData.message || 'Your prompt may violate content policy. Please try a different prompt.');
            setGeneratingImg(false);
            return;
          } else if (response.status === 402) {
            setError('OpenAI billing limit reached. Please contact the administrator.');
            setGeneratingImg(false);
            return;
          } else {
            throw new Error(errorData.message || `Server error: ${response.status}`);
          }
        }
        
        // Get the response text first
        let responseText;
        try {
          responseText = await response.text();
          console.log('Response text:', responseText.substring(0, 100) + '...');
        } catch (textError) {
          console.error('Error getting response text:', textError);
          throw new Error(`Server error: ${response.status}`);
        }
        
        // Try to parse the response text as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error(`Invalid response from server`);
        }
        
        console.log('Response received:', response.status, response.statusText);
        
        // Handle different response scenarios
        if (!response.ok) {
          console.error('Response error:', response.status, response.statusText);
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
        
        // Parse error response if available
        let errorMessage = '';
        if (err.response) {
          try {
            const errorData = await err.response.json();
            errorMessage = errorData.message;
          } catch (e) {
            // Couldn't parse response as JSON
          }
        }
        
        // Set more user-friendly error messages
        if (err.message && err.message.includes('billing limit')) {
          setError('The OpenAI account has reached its billing limit. Please contact the administrator to update the payment information.');
        } else if (errorMessage && errorMessage.includes('content policy')) {
          setError('Your prompt may violate content policy. Please try a different prompt with different subject matter.');
        } else if (err.message && err.message.includes('content policy')) {
          setError('Your prompt may violate content policy. Please try a different prompt with different subject matter.');
        } else if (err.status === 400 || (err.response && err.response.status === 400)) {
          setError('Your prompt contains content that cannot be generated. Please try a different subject.');
        } else {
          setError('Something went wrong while generating the image. Please try a different prompt.');
        }
      } finally {
        setGeneratingImg(false);
      }
    } else {
      setError('Please provide a prompt');
    }
  };

  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareWarning, setShareWarning] = useState('');

  const handleSubmit = async (e) => {
    console.log('Form submitted');
    e.preventDefault();

    if (form.prompt && form.photo) {
      setLoading(true);
      setError('');
      setShareSuccess(false);
      setShareWarning('');
      
      try {
        console.log('Submitting post with data:', {
          name: form.name,
          prompt: form.prompt,
          photoLength: form.photo ? form.photo.length : 0,
        });
        
        // Add timeout to fetch for better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch('http://localhost:8081/api/v1/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...form }),
          signal: controller.signal
        }).catch(fetchError => {
          clearTimeout(timeoutId);
          throw new Error(`Network error: ${fetchError.message}`);
        });
        
        clearTimeout(timeoutId);
        console.log('Post response status:', response.status);
        
        // Always try to parse the response as JSON
        const jsonResponse = await response.json().catch(e => {
          console.error('Failed to parse JSON response:', e);
          return null;
        });
        
        console.log('Post response data:', jsonResponse);
        
        // If the response indicates success (either full or with warning), treat it as a success
        if (jsonResponse?.success === true) {
          // Handle any warnings from the server
          if (jsonResponse?.warning) {
            setShareWarning(jsonResponse.warning);
            console.log('Post shared with warning:', jsonResponse.warning);
          }
          
          // Mark as successful and handle navigation
          setShareSuccess(true);
          console.log('Post shared successfully');
          
          // Check if this was a local storage save (has base64 data in photo field)
          const isLocalStorage = jsonResponse?.data?.photo?.startsWith('data:');
          
          if (isLocalStorage) {
            console.log('Image stored locally (not in Cloudinary)');
            // Don't navigate away - stay on this page to allow the user to see the warning
          } else {
            // Navigate after a short delay to allow the user to see the success message
            setTimeout(() => navigate('/'), 3000);
          }
        } else if (!response.ok || jsonResponse?.success === false) {
          // Handle specific Cloudinary credential errors with a more user-friendly approach
          if (jsonResponse?.message && jsonResponse.message.includes('Cloudinary credentials')) {
            setShareWarning('Your image was shared locally only (cloud storage unavailable).');
            setShareSuccess(true); // Still mark as success with warning
            console.log('Falling back to local storage due to Cloudinary credential issue');
          } else {
            // For other errors, show the error message
            throw new Error(jsonResponse?.message || `Server error: ${response.status}`);
          }
        }
      } catch (err) {
        console.error('Post submission error:', err);
        setError(err.message || 'Something went wrong while sharing your post');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please generate an image with proper details');
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
            {form.photo ? (
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
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800 shadow-sm flex items-start">
              <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-bold">Error:</span> {error}
              </div>
            </div>
          )}
          
          {shareSuccess && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800 shadow-sm flex items-start">
              <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-bold">Success!</span> Your creation has been shared successfully.
                {shareWarning && (
                  <p className="mt-1 text-amber-600 dark:text-amber-300">{shareWarning}</p>
                )}
                {!shareWarning && <p className="mt-2 text-sm opacity-75">Redirecting to home page...</p>}
              </div>
            </div>
          )}
          
          {shareWarning && !shareSuccess && (
            <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800 shadow-sm flex items-start">
              <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-bold">Note:</span> {shareWarning}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Generate button clicked manually');
              generateImage();
            }}
            onMouseDown={() => console.log('Generate button pressed')}
            className="text-white bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 font-medium rounded-md text-sm px-5 py-2.5 text-center transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
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