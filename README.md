# Facebook Lite - MERN Stack Development Project

This repository contains the implementation of a social media application called "Facebook Lite" as part of the MERN Stack Development Task 2 for the internship. The project includes a set of RESTful APIs and a corresponding front-end, focusing on user registration, login, password recovery, CRUD operations for posts, and interactions such as liking and commenting on posts.

## WebApp Link 
[Facebook Lite](https://facebook-lite.vercel.app)

## Project Overview

The main goal of this project was to create a social media application that allows users to perform various actions, including user registration, login, password recovery, creating, reading, updating, and deleting posts, as well as liking and commenting on posts. The project was developed using the MERN (MongoDB, Express.js, React, Node.js) stack.

## Project Structure

The project is structured as follows:

- `backend/`: Contains the back-end code for the RESTful APIs using Node.js and Express.js.
  - `routes/`: Includes the route definitions for different API endpoints.
  - `models/`: Contains the MongoDB schema models for users and posts.
  - `middleware/`: Contains middleware functions such as authentication.
- `frontend/`: Contains the front-end code built using React.
  - `src/`: Includes the React components and pages.
    - `components/`: Reusable components used in different parts of the application.
    - `components/screens/`: Individual pages for user registration, login, post display, etc.
    - `App.js`: Main entry point for the React app.

## Implemented Features

### User Registration and Login

- Users can register using their email, username, and password.
- Users can log in using their username and password.

### Password Recovery

- Users can reset their password in case they forget it.

### CRUD Operations for Posts

- Users can create, read, update, and delete their social media posts.

### Likes & Comment Functionality

- Users can like posts.
- Users can add comments to posts.

## Front-end Implementation

The front-end was developed using React.js to provide a seamless user experience. The user registration and login pages were designed for ease of use and security. The social media posts page displays posts and allows users to interact with them using intuitive controls. The likes and comments feature enhances user engagement and interaction.

## Instructions

1. Clone this repository to your local machine.
2. Set up the backend by navigating to the `backend/` directory and running `npm install` to install the required dependencies.
3. Start the backend server using `npm start`.
4. Navigate to the `frontend/` directory and run `npm install` to install the front-end dependencies.
5. Start the React app using `npm start`.
6. Access the application in your web browser at `http://localhost:3000`.

## Conclusion

In conclusion, this project demonstrates a functional social media application built using the MERN stack. It successfully implements user registration, login, password recovery, CRUD operations for posts, and liking and commenting functionalities. The project reflects the skills and knowledge acquired during the internship and showcases the ability to develop a modern web application from both the front-end and back-end perspectives.

For any questions or inquiries, please feel free to contact me at [ashwanix2749@gmail.com](mailto:ashwanix2749@gmail.com).