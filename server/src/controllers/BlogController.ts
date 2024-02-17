import catchAsyncErrors from "../modules/CatchAsyncErrors";
import Blog from "../models/blogModel";
import AppError from "../modules/appError";
import mongoose from "mongoose";

export const getAllBlogs = catchAsyncErrors(async (req, res) => {

  const blogs = await Blog.find()
  res.status(200).json({
    data: blogs
  })
})

export const getBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params
  const blog = await Blog.findById(id);

  if (!blog || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("No post found", 400))
  }

  res.status(200).json({
    data: blog
  })
})

export const createBlog = catchAsyncErrors(async (req, res) => {
  const { title, body } = req.body;
  const blog = { title, body, user: req.user }
  const newBlog = await Blog.create(blog)

  res.status(200).json({
    status: 'success',
    data: newBlog
  })

})

export const updateBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const update = req.body;
  const updatedBlog = await Blog.findOneAndUpdate({ _id: id }, update, { new: true });

  if (!updatedBlog || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Blog not found', 400));
  }

  res.status(200).json({ data: updatedBlog });
});

export const deleteBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;


  const deletingBlog = await Blog.findById(id);

  // Check if the blog exists
  if (!deletingBlog || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Blog not found', 404));
  }

  if (deletingBlog.user.toString() !== req.user.id) {
    return next(new AppError('You are not allowed to delete this blog', 403));
  }

  await Blog.deleteOne({ _id: id });

  res.status(200).json({
    message: "Blog deleted successfully"
  });
});

export const getBlogsByUser = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.userId;

  const blogs = await Blog.find({ user: userId });

  if (!blogs || blogs.length === 0) {
    return next(new AppError('No blogs found for the specified user', 204));
  }

  res.status(200).json({ data: blogs });
});

export const likeBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("No post found", 400))
  }
  if (!req.user) {
    return next(new AppError('Please login', 400));
  }

  const blog = await Blog.findById(id);

  const index = blog.likes.findIndex((likeId) => likeId.toString() === req.user.id.toString());

  if (index === -1) {
    blog.likes.push(req.user.id);
  } else {
    blog.likes = blog.likes.filter((likeId) => likeId.toString() !== req.user.id.toString());
  }

  const updatedPost = await Blog.findByIdAndUpdate(id, blog, { new: true });

  res.status(200).json({
    data: updatedPost
  });
});
