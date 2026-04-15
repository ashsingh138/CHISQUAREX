# Use the official Playwright image which includes Node.js and all browser dependencies
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your Express app runs on
EXPOSE 5000

# Start the server using node (not nodemon for production)
CMD ["node", "server.js"]