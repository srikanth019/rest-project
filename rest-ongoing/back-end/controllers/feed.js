const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
  .then(posts => {
    res.status(200).json({message: "Posts Fetched", posts: posts})
  })
  .catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
   }
   next(err);
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed. Please Enter correct data');
    error.statusCode = 422;
    throw error;
    // return res.status(422).json({message: "Validation Failed. Please enter Correct Data", errors: errors.array()})
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
    creator: {
      name: 'Srikanth'  
    },
    imageUrl: imageUrl
  });

  post.save()
  .then(result => {
    // console.log(result);
    res.status(201).json({
      message: 'Post created successfully!',
      post: result
    });
  }).catch(err => {
    if (!err.statusCode) {
       err.statusCode = 500;
    }
    next(err);
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

}
