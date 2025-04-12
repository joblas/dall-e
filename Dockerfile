# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies for the root project
COPY package*.json ./
RUN npm install

# Copy client package.json and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Bundle app source
COPY . .

# Build the client application
RUN cd client && npm run build

# Expose the port your app runs on
EXPOSE 8080

# Run the application
CMD ["npm", "start"]
