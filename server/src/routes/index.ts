import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';

const router = Router();

router.use('/auth', authRouter);

// Additional routes will be mounted here as features are implemented
// e.g. router.use('/posts', postsRouter);
//      router.use('/bikes', bikesRouter);

export { router };
