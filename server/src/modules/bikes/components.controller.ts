import type { Request, Response, NextFunction } from 'express';
import { componentsService } from './components.service.js';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const components = await componentsService.listComponents(bikeId, req.user?.id);
    res.json(components);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const component = await componentsService.createComponent(bikeId, req.user!.id, req.body);
    res.status(201).json(component);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const componentId = req.params['componentId'] as string;
    const component = await componentsService.updateComponent(
      bikeId,
      req.user!.id,
      componentId,
      req.body,
    );
    res.json(component);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const componentId = req.params['componentId'] as string;
    await componentsService.deleteComponent(bikeId, req.user!.id, componentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
