import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
export const pilotSpaces = sqliteTable('pilot_spaces', {
  owner: text('owner').primaryKey(),
  state: text('state').notNull(),
  revision: integer('revision').notNull().default(0),
  commitId: text('commit_id').notNull(),
  updated: text('updated').notNull(),
});
export const pilotEvents = sqliteTable(
  'pilot_events',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    revision: integer('revision').notNull(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    message: text('message').notNull(),
    created: text('created').notNull(),
  },
  (table) => [
    uniqueIndex('idx_events_owner_revision').on(table.owner, table.revision),
  ],
);
export const uploads = sqliteTable(
  'evidence_uploads',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    created: text('created').notNull(),
  },
  (table) => [index('idx_uploads_owner').on(table.owner)],
);

export const activityChats = sqliteTable('activity_chats', {
  owner: text('owner').primaryKey(),
  chat: text('chat').notNull(),
  revision: integer('revision').notNull().default(0),
  lockToken: text('lock_token').notNull(),
  lockedUntil: integer('locked_until').notNull().default(0),
});
export const aiUsage = sqliteTable(
  'ai_usage',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    window: integer('window').notNull(),
    count: integer('count').notNull(),
  },
  (table) => [index('idx_ai_usage_owner_window').on(table.owner, table.window)],
);
