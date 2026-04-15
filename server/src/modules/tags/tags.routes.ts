import { Router } from 'express';
import * as tagsController from './tags.controller.js';

export const tagsRouter = Router();

tagsRouter.get('/', tagsController.list);
tagsRouter.get('/:slug', tagsController.getBySlug);
