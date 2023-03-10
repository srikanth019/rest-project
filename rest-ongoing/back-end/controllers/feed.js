const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find()
      .skip((currentPage-1) * perPage)
      .limit(perPage)
    })
    .then(posts => {
      res.status(200).json({message: "Posts Fetched", posts: posts, totalItems: totalItems})
    })
    .catch(error => {
      if (!error.statusCode) {
          error.statusCode = 500;
      }
      next(error);
    })  
};

exports.createPost = (req, res, next) => {
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
  let creator;
  // Create post in db
  const post = new Post({
    title: title, 
    content: content,
    creator: req.userId,
    imageUrl: imageUrl
  });

  post.save()
  .then(result => {
    return User.findById(req.userId);
  })
  .then(user => {
    creator = user;
    user.posts.push(post);
    return user.save();
  })
  .then(result => {
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: {_id: creator._id, name: creator.name }
    });
  })
  .catch(error => {
    if (!error.statusCode) {
       error.statusCode = 500;
    }
    next(error);
  })
};

exports.getPost = (req,res,post) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Not Found any post');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({message: "Post fetched Successfully", post: post })
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });

};

exports.updatePost = (req,res,next) => {
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
  Post.findById(postId)
    .then(post => {
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
      return post.save();
    })
    .then(result => {
      res.status(200).json({message: "Post updated Successfully", post: result })
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.deletePost = (req,res,next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
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
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId)
    })
    .then(result => {
      return User.findById(req.userId)
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save()
    })
    .then(result => {
      res.status(200).json({message: "Post Deleted"})
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
}


exports.getStatus = (req,res, next) => {
  User
    .findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('Not Found any user');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({status: user.status})
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    })
};

exports.putStatus = (req, res,next) => {
  const newStatus = req.body.status;
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('Not Found any user');
        error.statusCode = 404;
        throw error;
      }
      user.status = newStatus;
      return user.save();
    })
    .then(result => {
      res.status(200).json({message: "Status Updated Successfully"})
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    })
}

const clearImage = (filePath) => {
  filePath = path.join(__dirname,'../', filePath);
  fs.unlink(filePath, err => console.log(err));
}
