import { db } from '../../db/index.js';
import type { MaintenanceLog, NewMaintenanceLog, MaintenanceLogUpdate } from '../../db/types.js';

export type MaintenanceLogWithComponent = MaintenanceLog & { component_name: string | null };

export const maintenanceRepository = {
  async findByBikeId(bikeId: string): Promise<MaintenanceLogWithComponent[]> {
    return db
      .selectFrom('maintenance_logs')
      .leftJoin('bike_components', 'bike_components.id', 'maintenance_logs.component_id')
      .selectAll('maintenance_logs')
      .select('bike_components.name as component_name')
      .where('maintenance_logs.bike_id', '=', bikeId)
      .orderBy('maintenance_logs.performed_at', 'desc')
      .execute();
  },

  async findById(logId: string): Promise<MaintenanceLog | undefined> {
    return db
      .selectFrom('maintenance_logs')
      .selectAll()
      .where('id', '=', logId)
      .executeTakeFirst();
  },

  async create(data: NewMaintenanceLog): Promise<MaintenanceLog> {
    return db
      .insertInto('maintenance_logs')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async update(logId: string, data: MaintenanceLogUpdate): Promise<MaintenanceLog | undefined> {
    return db
      .updateTable('maintenance_logs')
      .set(data)
      .where('id', '=', logId)
      .returningAll()
      .executeTakeFirst();
  },

  async deleteById(logId: string): Promise<void> {
    await db.deleteFrom('maintenance_logs').where('id', '=', logId).execute();
  },
};
