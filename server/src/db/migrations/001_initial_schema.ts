import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create enum types
  await sql`
    CREATE TYPE bike_type AS ENUM (
      'road', 'mtb', 'gravel', 'urban', 'touring', 'other'
    )
  `.execute(db);

  await sql`
    CREATE TYPE component_category AS ENUM (
      'frame', 'fork', 'groupset', 'wheels', 'tires', 'saddle',
      'handlebar', 'seatpost', 'pedals', 'brakes', 'chain', 'cassette',
      'crankset', 'bottom_bracket', 'headset', 'stem', 'bar_tape',
      'computer', 'lights', 'rack', 'fenders', 'bottle_cage', 'other'
    )
  `.execute(db);

  await sql`
    CREATE TYPE maintenance_type AS ENUM (
      'service', 'repair', 'upgrade', 'inspection'
    )
  `.execute(db);

  await sql`
    CREATE TYPE post_category AS ENUM (
      'review', 'maintenance_guide', 'ride_report', 'general'
    )
  `.execute(db);

  await sql`
    CREATE TYPE post_status AS ENUM (
      'draft', 'published'
    )
  `.execute(db);

  // Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('google_id', 'varchar', (col) => col.notNull().unique())
    .addColumn('email', 'varchar', (col) => col.notNull().unique())
    .addColumn('display_name', 'varchar', (col) => col.notNull())
    .addColumn('avatar_url', 'varchar')
    .addColumn('bio', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  // Create bikes table
  await db.schema
    .createTable('bikes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('brand', 'varchar', (col) => col.notNull())
    .addColumn('model', 'varchar', (col) => col.notNull())
    .addColumn('year', 'integer', (col) => col.notNull())
    .addColumn('type', sql`bike_type`, (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('hero_image_url', 'varchar')
    .addColumn('is_public', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  // Create bike_components table
  await db.schema
    .createTable('bike_components')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('bike_id', 'uuid', (col) =>
      col.notNull().references('bikes.id').onDelete('cascade')
    )
    .addColumn('category', sql`component_category`, (col) => col.notNull())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('brand', 'varchar')
    .addColumn('model', 'varchar')
    .addColumn('installed_at', 'date')
    .addColumn('mileage_at_install', 'integer')
    .addColumn('notes', 'text')
    .execute();

  // Create maintenance_logs table
  await db.schema
    .createTable('maintenance_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('bike_id', 'uuid', (col) =>
      col.notNull().references('bikes.id').onDelete('cascade')
    )
    .addColumn('component_id', 'uuid', (col) =>
      col.references('bike_components.id').onDelete('set null')
    )
    .addColumn('type', sql`maintenance_type`, (col) => col.notNull())
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('cost', 'decimal(10, 2)')
    .addColumn('mileage_at_service', 'integer')
    .addColumn('performed_at', 'date', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  // Create posts table
  await db.schema
    .createTable('posts')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('author_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('slug', 'varchar', (col) => col.notNull().unique())
    .addColumn('content', 'jsonb', (col) => col.notNull())
    .addColumn('excerpt', 'text')
    .addColumn('cover_image_url', 'varchar')
    .addColumn('category', sql`post_category`, (col) => col.notNull())
    .addColumn('status', sql`post_status`, (col) =>
      col.notNull().defaultTo(sql`'draft'::post_status`)
    )
    .addColumn('published_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW()`)
    )
    .execute();

  // Create tags table
  await db.schema
    .createTable('tags')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull().unique())
    .addColumn('slug', 'varchar', (col) => col.notNull().unique())
    .execute();

  // Create post_tags join table
  await db.schema
    .createTable('post_tags')
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade')
    )
    .addColumn('tag_id', 'integer', (col) =>
      col.notNull().references('tags.id').onDelete('cascade')
    )
    .addPrimaryKeyConstraint('post_tags_pkey', ['post_id', 'tag_id'])
    .execute();

  // Indexes for foreign keys and frequently queried columns
  await db.schema
    .createIndex('idx_bikes_user_id')
    .on('bikes')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_bike_components_bike_id')
    .on('bike_components')
    .column('bike_id')
    .execute();

  await db.schema
    .createIndex('idx_maintenance_logs_bike_id')
    .on('maintenance_logs')
    .column('bike_id')
    .execute();

  await db.schema
    .createIndex('idx_maintenance_logs_component_id')
    .on('maintenance_logs')
    .column('component_id')
    .execute();

  await db.schema
    .createIndex('idx_posts_author_id')
    .on('posts')
    .column('author_id')
    .execute();

  await db.schema
    .createIndex('idx_posts_slug')
    .on('posts')
    .column('slug')
    .execute();

  await db.schema
    .createIndex('idx_posts_status')
    .on('posts')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_post_tags_tag_id')
    .on('post_tags')
    .column('tag_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop tables in reverse dependency order
  await db.schema.dropTable('post_tags').execute();
  await db.schema.dropTable('tags').execute();
  await db.schema.dropTable('posts').execute();
  await db.schema.dropTable('maintenance_logs').execute();
  await db.schema.dropTable('bike_components').execute();
  await db.schema.dropTable('bikes').execute();
  await db.schema.dropTable('users').execute();

  // Drop enum types
  await sql`DROP TYPE post_status`.execute(db);
  await sql`DROP TYPE post_category`.execute(db);
  await sql`DROP TYPE maintenance_type`.execute(db);
  await sql`DROP TYPE component_category`.execute(db);
  await sql`DROP TYPE bike_type`.execute(db);
}
