# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Java Runtime Environment (JRE) for the APK builder
RUN apk add --no-cache openjdk8-jre

# Copy package.json and package-lock.json to the working directory
COPY server/package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the server application files to the working directory
COPY server/ .

# Make port 22533 available to the world outside this container
EXPOSE 22533

# Define environment variables
ENV NODE_ENV production

# Run the app when the container launches
CMD ["node", "index.js"]
