import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { postsRouter } from '../modules/posts/posts.routes.js';
import { tagsRouter } from '../modules/tags/tags.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/tags', tagsRouter);

export { router };
