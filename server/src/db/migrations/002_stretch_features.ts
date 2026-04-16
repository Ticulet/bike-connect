import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Comments (threaded, one level deep)
  await db.schema
    .createTable('comments')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade'),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('parent_id', 'uuid', (col) =>
      col.references('comments.id').onDelete('cascade'),
    )
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_comments_post_id')
    .on('comments')
    .column('post_id')
    .execute();

  await db.schema
    .createIndex('idx_comments_parent_id')
    .on('comments')
    .column('parent_id')
    .execute();

  // Likes (composite PK on user_id + post_id)
  await db.schema
    .createTable('likes')
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('likes_pkey', ['user_id', 'post_id'])
    .execute();

  await db.schema
    .createIndex('idx_likes_post_id')
    .on('likes')
    .column('post_id')
    .execute();

  // Bookmarks (composite PK on user_id + post_id)
  await db.schema
    .createTable('bookmarks')
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('bookmarks_pkey', ['user_id', 'post_id'])
    .execute();

  await db.schema
    .createIndex('idx_bookmarks_user_id')
    .on('bookmarks')
    .column('user_id')
    .execute();

  // Follows (composite PK, self-reference check)
  await db.schema
    .createTable('follows')
    .addColumn('follower_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('following_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('follows_pkey', ['follower_id', 'following_id'])
    .addCheckConstraint('follows_no_self', sql`follower_id <> following_id`)
    .execute();

  await db.schema
    .createIndex('idx_follows_following_id')
    .on('follows')
    .column('following_id')
    .execute();

  // Rides (per bike, for mileage tracking)
  await db.schema
    .createTable('rides')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('bike_id', 'uuid', (col) =>
      col.notNull().references('bikes.id').onDelete('cascade'),
    )
    .addColumn('distance_km', 'decimal(8, 2)', (col) => col.notNull())
    .addColumn('duration_min', 'integer')
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addCheckConstraint('rides_distance_positive', sql`distance_km > 0`)
    .execute();

  await db.schema
    .createIndex('idx_rides_bike_id')
    .on('rides')
    .column('bike_id')
    .execute();

  await db.schema
    .createIndex('idx_rides_bike_date')
    .on('rides')
    .columns(['bike_id', 'date'])
    .execute();

  // Add total_mileage_km to bikes (cache of SUM(rides.distance_km))
  await db.schema
    .alterTable('bikes')
    .addColumn('total_mileage_km', 'decimal(10, 2)', (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  // Full-text search vector on posts (generated column over title + excerpt)
  await sql`
    ALTER TABLE posts ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
      ) STORED
  `.execute(db);

  await sql`CREATE INDEX idx_posts_search ON posts USING GIN(search_vector)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_posts_search`.execute(db);
  await db.schema.alterTable('posts').dropColumn('search_vector').execute();
  await db.schema.alterTable('bikes').dropColumn('total_mileage_km').execute();
  await db.schema.dropTable('rides').execute();
  await db.schema.dropTable('follows').execute();
  await db.schema.dropTable('bookmarks').execute();
  await db.schema.dropTable('likes').execute();
  await db.schema.dropTable('comments').execute();
}
