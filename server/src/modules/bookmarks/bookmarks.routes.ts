import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import * as bookmarksController from './bookmarks.controller.js';

// Nested under posts/:postId
export const postBookmarksRouter = Router({ mergeParams: true });
postBookmarksRouter.get('/', optionalAuth, bookmarksController.getInfo);
postBookmarksRouter.post('/toggle', requireAuth, bookmarksController.toggle);

// Top-level for listing user's bookmarks
export const bookmarksRouter = Router();
bookmarksRouter.get('/', requireAuth, bookmarksController.listMine);
