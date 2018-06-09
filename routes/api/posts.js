const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Post = require('../../models/Post');

const Profile = require('../../models/Profile');

// Load Validation
const validatePostInput = require('../../validation/post');

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get("/test", (req, res) => res.json({
  msg: "Posts works"
}));

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get('/', (req, res) => {
  Post.find()
    .sort({
      date: -1
    })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({
      nopostsfound: "No posts found"
    }))
})

// @route   GET api/posts/:id
// @desc    Get posts by id
// @access  Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      res.json(post);
    })
    .catch(err => res.status(404).json({
      nopostfound: 'No post found with that ID'
    }))
})

// @route   POST api/posts
// @desc    Create posts
// @access  Private
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res) => {

  const {
    errors,
    isValid
  } = validatePostInput(req.body);

  // Check Validation
  if (!isValid) {
    // If any errors, send 400 with errors object
    res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  });

  newPost.save().then(post => res.json(post)).catch(error => res.json(error));

});

// @route   DELETE api/posts
// @desc    Delete posts
// @access  Private
router.delete('/:id', passport.authenticate('jwt', {
    session: false
  }),
  (req, res) => {
    Profile.findOne({
        user: req.user.id
      })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            if (profile.user.toString() !== req.user.id) {
              return res.status(401).json({
                notauthorized: 'User not autorized'
              });
            }

            // Delete
            post.remove()
              .then(() => res.json({
                success: true
              }))
          })
          .catch(err => res.status(404).json({
            postnotfound: 'No post found'
          }))
      })
  })


// @route   POST api/posts/like/:id
// @desc    Add likes to post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', {
    session: false
  }),
  (req, res) => {
    Profile.findOne({
        user: req.user.id
      })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
              return res.status(400).json({
                alreadyliked: 'User already liked this post'
              });
            }

            // Add user id to likes array
            post.likes.unshift({
              user: req.user.id
            });

            post.save().then(post => res.json(post));

          })
          .catch(err => res.status(404).json({
            postnotfound: 'No post found'
          }))
      })
  })

// @route   POST api/posts/unlike/:id
// @desc    Add likes to post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', {
    session: false
  }),
  (req, res) => {
    Profile.findOne({
        user: req.user.id
      })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
              return res.status(400).json({
                notliked: 'You have not liked this post'
              });
            }

            // Get remove index
            const removeIndex = post.likes
              .map(item => item.user.toString())
              .indexOf(req.user.id);
            // Splice it out of the array
            post.likes.splice(removeIndex, 1);

            post.save().then(post => res.json(post));

          })
          .catch(err => res.status(404).json({
            postnotfound: 'No post found'
          }))
      })
  })

module.exports = router;