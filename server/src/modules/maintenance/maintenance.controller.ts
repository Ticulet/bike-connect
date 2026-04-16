import type { Request, Response, NextFunction } from 'express';
import { maintenanceService } from './maintenance.service.js';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const logs = await maintenanceService.listLogs(bikeId, req.user!.id);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const log = await maintenanceService.createLog(bikeId, req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const logId = req.params['logId'] as string;
    const log = await maintenanceService.updateLog(bikeId, req.user!.id, logId, req.body);
    res.json(log);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const logId = req.params['logId'] as string;
    await maintenanceService.deleteLog(bikeId, req.user!.id, logId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
