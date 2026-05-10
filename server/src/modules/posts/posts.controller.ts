import type { Request, Response, NextFunction } from 'express';
import { postsService } from './posts.service.js';
import type { PostQuery } from '@bike-connect/shared';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as PostQuery;
    const posts = await postsService.listPublished({
      cursor: query.cursor,
      limit: query.limit,
      category: query.category,
      tagSlug: query.tag,
      authorId: query.author,
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = req.params['slug'] as string;
    const post = await postsService.getPostBySlug(slug);
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const posts = await postsService.listMyPosts(req.user!.id);
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const post = await postsService.getPostById(id, req.user!.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postsService.createPost(req.user!.id, req.body);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const { expected_updated_at, ...data } = req.body;
    const post = await postsService.updatePost(id, req.user!.id, data, expected_updated_at as string);
    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as { q: string; limit: number };
    const posts = await postsService.searchPosts(query.q, query.limit);
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    await postsService.deletePost(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
