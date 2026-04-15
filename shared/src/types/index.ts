import type { z } from 'zod';

import type {
  uuidSchema,
  slugSchema,
  idParamSchema,
  paginationQuerySchema,
} from '../schemas/common.schema.js';

import type {
  googleCallbackSchema,
  authUserSchema,
  loginResponseSchema,
} from '../schemas/auth.schema.js';

import type { updateUserSchema } from '../schemas/user.schema.js';

import type {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
} from '../schemas/post.schema.js';

import type {
  createBikeSchema,
  updateBikeSchema,
} from '../schemas/bike.schema.js';

import type {
  createComponentSchema,
  updateComponentSchema,
} from '../schemas/component.schema.js';

import type {
  createMaintenanceLogSchema,
  updateMaintenanceLogSchema,
} from '../schemas/maintenance.schema.js';

import type { createTagSchema, updateTagSchema } from '../schemas/tag.schema.js';

// Common types
export type Uuid = z.infer<typeof uuidSchema>;
export type Slug = z.infer<typeof slugSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// Auth types
export type GoogleCallback = z.infer<typeof googleCallbackSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// User types
export type UpdateUser = z.infer<typeof updateUserSchema>;

// Post types
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type PostQuery = z.infer<typeof postQuerySchema>;

// Bike types
export type CreateBike = z.infer<typeof createBikeSchema>;
export type UpdateBike = z.infer<typeof updateBikeSchema>;

// Component types
export type CreateComponent = z.infer<typeof createComponentSchema>;
export type UpdateComponent = z.infer<typeof updateComponentSchema>;

// Maintenance log types
export type CreateMaintenanceLog = z.infer<typeof createMaintenanceLogSchema>;
export type UpdateMaintenanceLog = z.infer<typeof updateMaintenanceLogSchema>;

// Tag types
export type CreateTag = z.infer<typeof createTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
