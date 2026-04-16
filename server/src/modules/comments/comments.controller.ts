import type { Request, Response, NextFunction } from 'express';
import { commentsService } from './comments.service.js';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params['postId'] as string;
    const comments = await commentsService.listForPost(postId);
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params['postId'] as string;
    const comment = await commentsService.addComment(postId, req.user!.id, req.body);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const comment = await commentsService.updateComment(id, req.user!.id, req.body.content as string);
    res.json(comment);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    await commentsService.deleteComment(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
