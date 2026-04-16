import type { Request, Response, NextFunction } from 'express';
import { bikesService } from './bikes.service.js';
import type { BikeType } from '../../db/types.js';

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikes = await bikesService.listMyBikes(req.user!.id);
    res.json(bikes);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const bike = await bikesService.getBike(id, req.user?.id);
    res.json(bike);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bike = await bikesService.createBike(req.user!.id, req.body);
    res.status(201).json(bike);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const bike = await bikesService.updateBike(id, req.user!.id, req.body);
    res.json(bike);
  } catch (err) {
    next(err);
  }
}

export async function listExplore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as { cursor?: string; limit: number; type?: string };
    const result = await bikesService.listExplore({
      cursor: query.cursor,
      limit: query.limit,
      type: query.type as BikeType | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    await bikesService.deleteBike(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
