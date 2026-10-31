import {
  boolean,
  double,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Manus OAuth-backed application users. The OWNER_OPEN_ID environment value is the only bootstrap path to the initial admin role. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  city: varchar("city", { length: 120 }),
  preferences: json("preferences").$type<{ emailUpdates?: boolean; smsUpdates?: boolean }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  nickname: varchar("nickname", { length: 80 }),
  make: varchar("make", { length: 80 }).notNull().default("Tesla"),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year"),
  registration: varchar("registration", { length: 32 }),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => [index("vehicles_user_idx").on(table.userId)]);

export const requestKinds = ["roadside", "rental", "maintenance"] as const;
export const requestStatuses = ["new", "pending", "assigned", "in_progress", "completed", "cancelled"] as const;

export const serviceRequests = mysqlTable("service_requests", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 24 }).notNull().unique(),
  userId: int("user_id").notNull().references(() => users.id),
  vehicleId: int("vehicle_id").references(() => vehicles.id),
  kind: mysqlEnum("kind", requestKinds).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  summary: varchar("summary", { length: 180 }).notNull(),
  status: mysqlEnum("status", requestStatuses).default("pending").notNull(),
  details: json("details").$type<Record<string, unknown>>(),
  locationText: varchar("location_text", { length: 500 }),
  latitude: double("latitude"),
  longitude: double("longitude"),
  locationConsent: boolean("location_consent").default(false).notNull(),
  estimatedPriceInr: int("estimated_price_inr"),
  assignedTeamId: int("assigned_team_id").references(() => teamMembers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("service_requests_user_idx").on(table.userId, table.updatedAt),
  index("service_requests_status_idx").on(table.status, table.createdAt),
  index("service_requests_kind_idx").on(table.kind, table.createdAt),
]);

export const requestMessages = mysqlTable("request_messages", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull().references(() => serviceRequests.id),
  senderUserId: int("sender_user_id").notNull().references(() => users.id),
  senderRole: mysqlEnum("sender_role", ["customer", "admin"]).notNull(),
  body: text("body").notNull(),
  customerVisible: boolean("customer_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("request_messages_request_idx").on(table.requestId, table.createdAt)]);

export const requestNotes = mysqlTable("request_notes", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull().references(() => serviceRequests.id),
  adminUserId: int("admin_user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("request_notes_request_idx").on(table.requestId, table.createdAt)]);

export const requestStatusEvents = mysqlTable("request_status_events", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull().references(() => serviceRequests.id),
  actorUserId: int("actor_user_id").notNull().references(() => users.id),
  fromStatus: varchar("from_status", { length: 32 }),
  toStatus: mysqlEnum("to_status", requestStatuses).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("request_status_events_request_idx").on(table.requestId, table.createdAt)]);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  requestId: int("request_id").references(() => serviceRequests.id),
  kind: mysqlEnum("kind", ["request_reply", "status_update", "feedback_reply", "general"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: varchar("body", { length: 500 }).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("notifications_user_idx").on(table.userId, table.createdAt)]);

export const favoriteStations = mysqlTable("favorite_stations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  stationKey: varchar("station_key", { length: 160 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  connectorTypes: json("connector_types").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [
  uniqueIndex("favorite_station_owner_key").on(table.userId, table.stationKey),
  index("favorite_stations_user_idx").on(table.userId),
]);

export const savedJourneys = mysqlTable("saved_journeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  origin: varchar("origin", { length: 240 }).notNull(),
  destination: varchar("destination", { length: 240 }).notNull(),
  distanceKm: double("distance_km"),
  durationMinutes: int("duration_minutes"),
  chargingStops: json("charging_stops").$type<Array<{ name: string; address: string; sample: boolean }>>(),
  estimateSource: varchar("estimate_source", { length: 80 }).notNull().default("not available"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("saved_journeys_user_idx").on(table.userId, table.createdAt)]);

export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  requestId: int("request_id").references(() => serviceRequests.id),
  rating: int("rating").notNull(),
  body: text("body"),
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("feedback_created_idx").on(table.createdAt)]);

export const serviceSettings = mysqlTable("service_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 120 }).notNull().unique(),
  value: text("value").notNull(),
  updatedByUserId: int("updated_by_user_id").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
