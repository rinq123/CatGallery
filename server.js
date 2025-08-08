const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
require('dotenv').config();

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Atlas connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}); 
const User = mongoose.model('User', userSchema);

const commentSchema = new mongoose.Schema({
    imageId: { type: String, required: true }, // or ObjectId if you use MongoDB image docs
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', commentSchema);

const likeSchema = new mongoose.Schema({
    imageId: { type: String, required: true },
    username: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Like = mongoose.model('Like', likeSchema);

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try{
    const existing = await User.findOne({ username });
    if(existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });
    res.status(201).json({ message: 'User created successfully' });
  }catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try{
        const user = await User.findOne({ username });
        if(!user){
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if(!valid) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }   
        req.session.user = { username };
        return res.json({message: 'Login successful', username});
    }catch(err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/comments', async(req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
    const { imageId, text } = req.body;
    try {
        const comment = await Comment.create({
            imageId,
            username: req.session.user.username,
            text
        });
        res.status(201).json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/like', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
    const { imageId } = req.body;
    try{
        const existing = await Like.findOne({ imageId, username: req.session.user.username });
        if(existing) return res.status(400).json({ message: "Already liked" });
        await Like.create({ imageId, username: req.session.user.username });
        res.json({ message: "Liked" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/unlike', async (req, res) => {
    if(!req.session.user) return res.status(401).json({ message: "Not logged in" });
    const { imageId } = req.body;
    try{
        await Like.deleteOne({ imageId, username: req.session.user.username });
        res.json({ message: "Unliked" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.get('/api/comments/:imageId', async (req, res) => {
  try {
    const comments = await Comment.find({ imageId: req.params.imageId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/likes/:imageId', async (req, res) => {
    try{
        const count = await Like.countDocuments({ imageId: req.params.imageId });
        res.json({ count });
    } catch (err){
        res.status(500).json({ message: "Server error" });
    }
});

// Get current logged-in user
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
  res.json({ user: req.session.user });
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



