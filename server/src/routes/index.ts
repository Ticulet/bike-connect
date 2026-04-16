import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { postsRouter } from '../modules/posts/posts.routes.js';
import { tagsRouter } from '../modules/tags/tags.routes.js';
import { bikesRouter } from '../modules/bikes/bikes.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { imagesRouter } from '../modules/images/images.routes.js';
import { feedRouter } from '../modules/feed/feed.routes.js';
import { commentsRouter } from '../modules/comments/comments.routes.js';
import { bookmarksRouter } from '../modules/bookmarks/bookmarks.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/tags', tagsRouter);
router.use('/bikes', bikesRouter);
router.use('/users', usersRouter);
router.use('/images', imagesRouter);
router.use('/feed', feedRouter);
router.use('/comments', commentsRouter);
router.use('/me/bookmarks', bookmarksRouter);

export { router };
