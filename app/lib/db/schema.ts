import { mysqlTable, varchar, int, text, datetime, decimal, float, mysqlEnum, bigint } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// Zones table
export const zones = mysqlTable('zones', {
  zone_id: varchar('zone_id', { length: 20 }).primaryKey(),
});

// Compute Server 2 table
export const compute_server2 = mysqlTable('compute_server2', {
  id: int('id').autoincrement().primaryKey(),
  parent_server_id: int('parent_server_id'),
  node_type: mysqlEnum('node_type', ['HOST', 'VM']).notNull(),
  status: mysqlEnum('status', ['provisioned', 'failed']).notNull(),
  status_percent: decimal('status_percent', { precision: 5, scale: 2 }),
  provision_percent: decimal('provision_percent', { precision: 5, scale: 2 }).notNull(),
  status_message: text('status_message'),
  error_type: mysqlEnum('error_type', [
    'HARDWARE_FAILURE',
    'RESOURCE_FAILURE',
    'STORAGE_FAILURE',
    'NETWORK_FAILURE',
    'IP_FAILURE',
    'POWER_FAILURE',
    'HOST_FAILURE',
  ]),
  error_message: varchar('error_message', { length: 255 }),
  provision_time: float('provision_time').notNull(),
  status_date: datetime('status_date').notNull(),
  max_memory: int('max_memory').notNull(),
  max_cores: int('max_cores').notNull(),
  max_storage: int('max_storage').notNull(),
  power_state: varchar('power_state', { length: 10 }).notNull(),
  zone_id: varchar('zone_id', { length: 20 }).notNull(),
});

// Zone Metrics table
export const zone_metrics = mysqlTable('zone_metrics', {
  id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
  zone_id: varchar('zone_id', { length: 20 }).notNull(),
  calculated_at: datetime('calculated_at').notNull(),
  pri_score: decimal('pri_score', { precision: 8, scale: 4 }).notNull(),
  success_rate: decimal('success_rate', { precision: 8, scale: 4 }).notNull(),
  failure_rate: decimal('failure_rate', { precision: 8, scale: 4 }).notNull(),
  avg_provision_time: decimal('avg_provision_time', { precision: 10, scale: 2 }).notNull(),
  stability_score: decimal('stability_score', { precision: 8, scale: 4 }).notNull(),
  dependency_penalty: decimal('dependency_penalty', { precision: 8, scale: 4 }).notNull(),
  latency_penalty: decimal('latency_penalty', { precision: 8, scale: 4 }).notNull(),
});

// Relations
export const compute_server2_relations = relations(compute_server2, ({ one, many }) => ({
  parent: one(compute_server2, {
    fields: [compute_server2.parent_server_id],
    references: [compute_server2.id],
    relationName: 'parent',
  }),
  children: many(compute_server2, { relationName: 'children' }),
  zone: one(zones, {
    fields: [compute_server2.zone_id],
    references: [zones.zone_id],
  }),
}));

export const zone_metrics_relations = relations(zone_metrics, ({ one }) => ({
  zone: one(zones, {
    fields: [zone_metrics.zone_id],
    references: [zones.zone_id],
  }),
}));
