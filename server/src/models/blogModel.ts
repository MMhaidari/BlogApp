import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A blog should have a title'],
    maxlength: [250, 'A blog title must have less than or equal to 250 characters'],
    minlength: [3, 'A blog title must have at least 3 characters'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'A blog should have a body'],
    minlength: [10, 'A blog body must have at least 10 characters'],
    trim: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A blog should be created by a user'],
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  comments: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
  }],
  tags: [String],
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,
  // Add more fields as needed
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog