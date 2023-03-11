const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .skip((currentPage-1) * perPage)
      .limit(perPage)
    res.status(200).json( {
      message: "Posts Fetched",
      posts: posts,
      totalItems: totalItems
    })
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed. Please Enter correct data');
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error('Image is not Found.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  // Create post in db
  const post = new Post({
    title: title, 
    content: content,
    creator: req.userId,
    imageUrl: imageUrl
  });
  try{
    await post.save()
    const user = await User.findById(req.userId);
      user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: {_id: user._id, name: user.name }
    });
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getPost = async (req,res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Not Found any post');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({message: "Post fetched Successfully", post: post })
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }

};

exports.updatePost = async (req,res,next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed. Please Enter correct data');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error('No file Picked');
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Not Found any post');
      error.statusCode = 404;
      throw error;
    }
      //Checking Authorization
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = await post.save();
    res.status(200).json({message: "Post updated Successfully", post: result })
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost = async (req,res,next) => {
  const postId = req.params.postId;
  try {
  const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Not Found any post');
      error.statusCode = 404;
      throw error;
    }
    // Checking Authorization
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }
    //Check loggedin user
    await clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId)
    const user = await User.findById(req.userId)
      user.posts.pull(postId);
      await user.save()
    res.status(200).json({message: "Post Deleted"})
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};


exports.getStatus = async (req,res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('Not Found any user');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({status: user.status})
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.putStatus = async (req, res,next) => {
  const newStatus = req.body.status;
  try {
  const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('Not Found any user');
      error.statusCode = 404;
      throw error;
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({message: "Status Updated Successfully"})
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname,'../', filePath);
  fs.unlink(filePath, err => console.log(err));
};
