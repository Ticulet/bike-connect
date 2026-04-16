import type { Request, Response, NextFunction } from 'express';
import { ridesService } from './rides.service.js';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const rides = await ridesService.listRides(bikeId, req.user!.id);
    res.json(rides);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const stats = await ridesService.getStats(bikeId, req.user!.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const ride = await ridesService.createRide(bikeId, req.user!.id, req.body);
    res.status(201).json(ride);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const rideId = req.params['rideId'] as string;
    const ride = await ridesService.updateRide(bikeId, req.user!.id, rideId, req.body);
    res.json(ride);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const rideId = req.params['rideId'] as string;
    await ridesService.deleteRide(bikeId, req.user!.id, rideId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
