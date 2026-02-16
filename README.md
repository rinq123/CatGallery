# CatGallery

A lightweight cat gallery that pulls images from TheCatAPI, supports favorites, and includes a lightbox with random cat facts.

## Live Demo

- https://rinq123.github.io/CatGallery/

## Demo Limitations

Login and signup are disabled in the live demo. They require the Node/Express + MongoDB backend and session support, which do not run on GitHub Pages.

## Features

- Infinite scroll cat gallery
- Favorites saved in localStorage
- Lightbox with next/prev navigation
- Random cat facts on open and navigation
- Dark mode toggle

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- APIs: TheCatAPI, catfact.ninja
- Backend (local only): Node.js, Express, MongoDB, bcryptjs, express-session

## Local Development

1. Install dependencies
   npm install
2. Create a .env file in the project root with:
   MONGODB_URI=your_mongodb_uri
   SESSION_SECRET=your_session_secret
3. Start the server
   npm start
4. Open:
   http://localhost:3000

## Notes

Favorites are stored in localStorage and only apply to the browser you are using.