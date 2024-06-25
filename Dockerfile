# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Set the environment variable
ENV OPENAI_API_KEY=your_api_key_here
ENV MongoDB_URI=your_mongodb_uri_here

# Run the application
CMD ["npm", "start"]
