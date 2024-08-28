# Use a base image with Node.js
FROM node:18

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Make yt-dlp_linux executable
RUN chmod +x yt-dlp_linux

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
