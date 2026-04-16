import type { ColumnType, Generated, Selectable, Insertable, Updateable } from 'kysely';

// Enum types matching PostgreSQL exactly
export type BikeType = 'road' | 'mtb' | 'gravel' | 'urban' | 'touring' | 'other';

export type ComponentCategory =
  | 'frame'
  | 'fork'
  | 'groupset'
  | 'wheels'
  | 'tires'
  | 'saddle'
  | 'handlebar'
  | 'seatpost'
  | 'pedals'
  | 'brakes'
  | 'chain'
  | 'cassette'
  | 'crankset'
  | 'bottom_bracket'
  | 'headset'
  | 'stem'
  | 'bar_tape'
  | 'computer'
  | 'lights'
  | 'rack'
  | 'fenders'
  | 'bottle_cage'
  | 'other';

export type MaintenanceType = 'service' | 'repair' | 'upgrade' | 'inspection';

export type PostCategory = 'review' | 'maintenance_guide' | 'ride_report' | 'general';

export type PostStatus = 'draft' | 'published';

// Table interfaces
export interface UsersTable {
  id: Generated<string>;
  google_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
}

export interface BikesTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: BikeType;
  description: string | null;
  hero_image_url: string | null;
  is_public: ColumnType<boolean, boolean | undefined, boolean>;
  total_mileage_km: ColumnType<string, string | number | undefined, string | number>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
}

export interface CommentsTable {
  id: Generated<string>;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface LikesTable {
  user_id: string;
  post_id: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface BookmarksTable {
  user_id: string;
  post_id: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface FollowsTable {
  follower_id: string;
  following_id: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface RidesTable {
  id: Generated<string>;
  user_id: string;
  bike_id: string;
  distance_km: ColumnType<string, string | number, string | number>;
  duration_min: number | null;
  date: string;
  notes: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface BikeComponentsTable {
  id: Generated<string>;
  bike_id: string;
  category: ComponentCategory;
  name: string;
  brand: string | null;
  model: string | null;
  installed_at: string | null;
  mileage_at_install: number | null;
  notes: string | null;
}

export interface MaintenanceLogsTable {
  id: Generated<string>;
  bike_id: string;
  component_id: string | null;
  type: MaintenanceType;
  title: string;
  description: string | null;
  cost: ColumnType<string | null, number | null, number | null>;
  mileage_at_service: number | null;
  performed_at: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface PostsTable {
  id: Generated<string>;
  author_id: string;
  title: string;
  slug: string;
  content: ColumnType<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
  excerpt: string | null;
  cover_image_url: string | null;
  category: PostCategory;
  status: ColumnType<PostStatus, PostStatus | undefined, PostStatus>;
  published_at: Date | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
}

export interface TagsTable {
  id: Generated<number>;
  name: string;
  slug: string;
}

export interface PostTagsTable {
  post_id: string;
  tag_id: number;
}

// Database interface
export interface Database {
  users: UsersTable;
  bikes: BikesTable;
  bike_components: BikeComponentsTable;
  maintenance_logs: MaintenanceLogsTable;
  posts: PostsTable;
  tags: TagsTable;
  post_tags: PostTagsTable;
  comments: CommentsTable;
  likes: LikesTable;
  bookmarks: BookmarksTable;
  follows: FollowsTable;
  rides: RidesTable;
}

// Selectable, Insertable, Updateable type exports per table
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type Bike = Selectable<BikesTable>;
export type NewBike = Insertable<BikesTable>;
export type BikeUpdate = Updateable<BikesTable>;

export type BikeComponent = Selectable<BikeComponentsTable>;
export type NewBikeComponent = Insertable<BikeComponentsTable>;
export type BikeComponentUpdate = Updateable<BikeComponentsTable>;

export type MaintenanceLog = Selectable<MaintenanceLogsTable>;
export type NewMaintenanceLog = Insertable<MaintenanceLogsTable>;
export type MaintenanceLogUpdate = Updateable<MaintenanceLogsTable>;

export type Post = Selectable<PostsTable>;
export type NewPost = Insertable<PostsTable>;
export type PostUpdate = Updateable<PostsTable>;

export type Tag = Selectable<TagsTable>;
export type NewTag = Insertable<TagsTable>;
export type TagUpdate = Updateable<TagsTable>;

export type PostTag = Selectable<PostTagsTable>;
export type NewPostTag = Insertable<PostTagsTable>;
export type PostTagUpdate = Updateable<PostTagsTable>;

export type Comment = Selectable<CommentsTable>;
export type NewComment = Insertable<CommentsTable>;
export type CommentUpdate = Updateable<CommentsTable>;

export type Like = Selectable<LikesTable>;
export type NewLike = Insertable<LikesTable>;

export type Bookmark = Selectable<BookmarksTable>;
export type NewBookmark = Insertable<BookmarksTable>;

export type Follow = Selectable<FollowsTable>;
export type NewFollow = Insertable<FollowsTable>;

export type Ride = Selectable<RidesTable>;
export type NewRide = Insertable<RidesTable>;
export type RideUpdate = Updateable<RidesTable>;
