import { Router } from "express";
import { createBlog, deleteBlog, getAllBlogs, getBlog, getBlogsByUser, likeBlog, updateBlog } from "../controllers/BlogController";
import { body } from "express-validator";
import handleRequestErrors from "../modules/requestValidator";

const router = Router();

router.get('/', getAllBlogs);

router.post('/',
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  handleRequestErrors,
  createBlog
);

router.get('/:id', getBlog)

router.patch('/:id',
  body('title').isString().optional(),
  body('body').isString().optional(),
  handleRequestErrors,
  updateBlog
);

router.delete('/:id', deleteBlog)

router.post('/:id/like', likeBlog)
router.get('/user/:userId', getBlogsByUser)


export { router as blogsRouter };