import { and, desc, eq, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  favoriteStations,
  feedback,
  notifications,
  requestMessages,
  requestStatuses,
  requestStatusEvents,
  savedJourneys,
  serviceRequests,
  serviceSettings,
  users,
  vehicles,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const database = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable." });
  return db;
};

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(32).optional().default(""),
  preferences: z.object({ emailUpdates: z.boolean(), smsUpdates: z.boolean() }),
});

const vehicleSchema = z.object({
  nickname: z.string().trim().max(80).optional().default(""),
  make: z.string().trim().min(1).max(80).default("Tesla"),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional().nullable(),
  registration: z.string().trim().max(32).optional().default(""),
});

const requestCategories = {
  roadside: ["Flat tyre", "Battery problems", "Vehicle breakdown", "Towing", "Lockout assistance"],
  rental: ["Model 3 Long Range · sample category"],
  maintenance: ["Vehicle inspection", "Battery diagnostics", "Tyres and brakes", "General maintenance", "Detailing"],
} as const;

const isCalendarDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const requestSchema = z.object({
  kind: z.enum(["roadside", "rental", "maintenance"]),
  category: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(4).max(180),
  vehicleId: z.number().int().positive().optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional().default({}),
  locationText: z.string().trim().max(500).optional().default(""),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  locationConsent: z.boolean().default(false),
  estimatedPriceInr: z.number().int().min(0).max(10_000_000).optional().nullable(),
}).refine(value => value.locationConsent || (value.latitude == null && value.longitude == null), {
  message: "Location coordinates require your explicit consent.",
  path: ["locationConsent"],
}).superRefine((value, context) => {
  const allowedCategories: readonly string[] = requestCategories[value.kind];
  if (!allowedCategories.includes(value.category)) {
    context.addIssue({ code: "custom", path: ["category"], message: "Choose a valid service category." });
  }
  if (value.kind === "rental") {
    const pickupLocation = typeof value.details.pickupLocation === "string" ? value.details.pickupLocation.trim() : "";
    const pickupDate = value.details.pickupDate;
    const returnDate = value.details.returnDate;
    if (!pickupLocation || pickupLocation.length > 240) {
      context.addIssue({ code: "custom", path: ["details", "pickupLocation"], message: "A valid rental pickup location is required." });
    }
    if (!isCalendarDate(pickupDate)) {
      context.addIssue({ code: "custom", path: ["details", "pickupDate"], message: "Enter a valid pickup date." });
    }
    if (!isCalendarDate(returnDate)) {
      context.addIssue({ code: "custom", path: ["details", "returnDate"], message: "Enter a valid return date." });
    } else if (isCalendarDate(pickupDate) && returnDate < pickupDate) {
      context.addIssue({ code: "custom", path: ["details", "returnDate"], message: "Return date must be on or after pickup date." });
    }
  }
});

type AvailabilityState = "not_configured" | "available" | "unavailable";
const readServiceAvailability = async (db: Awaited<ReturnType<typeof database>>) => {
  const [row] = await db.select({ value: serviceSettings.value }).from(serviceSettings).where(eq(serviceSettings.settingKey, "service.availability")).limit(1);
  let raw: Record<string, unknown> = {};
  try {
    const parsed: unknown = row ? JSON.parse(row.value) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) raw = parsed as Record<string, unknown>;
  } catch { /* Treat malformed settings as unconfigured, never as available. */ }
  const state = (key: string): AvailabilityState => raw[key] === "available" || raw[key] === "unavailable" ? raw[key] as AvailabilityState : "not_configured";
  return { roadside: state("roadside"), rentals: state("rentals"), maintenance: state("maintenance"), charging: state("charging") };
};

export const customerRouter = router({
  serviceAvailability: protectedProcedure.query(async () => {
    const db = await database();
    return readServiceAvailability(db);
  }),

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    const [vehicleRows, requestRows, notificationRows] = await Promise.all([
      db.select().from(vehicles).where(and(eq(vehicles.userId, ctx.user.id), isNull(vehicles.archivedAt))).orderBy(desc(vehicles.createdAt)).limit(8),
      db.select().from(serviceRequests).where(eq(serviceRequests.userId, ctx.user.id)).orderBy(desc(serviceRequests.updatedAt)).limit(8),
      db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(8),
    ]);
    return { vehicles: vehicleRows, requests: requestRows, notifications: notificationRows };
  }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    const rows = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, preferences: users.preferences }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return rows[0] ?? null;
  }),

  updateProfile: protectedProcedure.input(profileSchema).mutation(async ({ ctx, input }) => {
    const db = await database();
    await db.update(users).set({ name: input.name, city: input.city || null, phone: input.phone || null, preferences: input.preferences }).where(eq(users.id, ctx.user.id));
    return { ok: true };
  }),

  vehicles: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select().from(vehicles).where(and(eq(vehicles.userId, ctx.user.id), isNull(vehicles.archivedAt))).orderBy(desc(vehicles.createdAt));
  }),

  addVehicle: protectedProcedure.input(vehicleSchema).mutation(async ({ ctx, input }) => {
    const db = await database();
    const inserted = await db.insert(vehicles).values({
      userId: ctx.user.id,
      nickname: input.nickname || null,
      make: input.make,
      model: input.model,
      year: input.year ?? null,
      registration: input.registration || null,
    }).$returningId();
    return { id: inserted[0]?.id ?? null };
  }),

  archiveVehicle: protectedProcedure.input(z.object({ vehicleId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await database();
    await db.update(vehicles).set({ archivedAt: new Date() }).where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.userId, ctx.user.id)));
    return { ok: true };
  }),

  requests: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select().from(serviceRequests).where(eq(serviceRequests.userId, ctx.user.id)).orderBy(desc(serviceRequests.updatedAt)).limit(100);
  }),

  requestThread: protectedProcedure.input(z.object({ requestId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await database();
    const [request] = await db.select().from(serviceRequests).where(and(eq(serviceRequests.id, input.requestId), eq(serviceRequests.userId, ctx.user.id))).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    const messages = await db.select().from(requestMessages).where(and(eq(requestMessages.requestId, request.id), eq(requestMessages.customerVisible, true))).orderBy(requestMessages.createdAt);
    return { request, messages };
  }),

  createRequest: protectedProcedure.input(requestSchema).mutation(async ({ ctx, input }) => {
    const db = await database();
    const availability = await readServiceAvailability(db);
    const availabilityKey = input.kind === "rental" ? "rentals" : input.kind;
    if (availability[availabilityKey] === "unavailable") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This service is currently marked unavailable. Your request was not submitted." });
    }
    if (input.vehicleId) {
      const [ownedVehicle] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.userId, ctx.user.id), isNull(vehicles.archivedAt))).limit(1);
      if (!ownedVehicle) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a vehicle from your garage." });
    }
    const publicId = `WST-${nanoid(8).toUpperCase()}`;
    const inserted = await db.insert(serviceRequests).values({
      publicId,
      userId: ctx.user.id,
      vehicleId: input.vehicleId ?? null,
      kind: input.kind,
      category: input.category,
      summary: input.summary,
      status: "new",
      details: input.details,
      locationText: input.locationText || null,
      latitude: input.locationConsent ? input.latitude ?? null : null,
      longitude: input.locationConsent ? input.longitude ?? null : null,
      locationConsent: input.locationConsent,
      estimatedPriceInr: input.estimatedPriceInr ?? null,
    }).$returningId();
    const requestId = inserted[0]?.id;
    if (requestId) {
      await db.insert(requestStatusEvents).values({ requestId, actorUserId: ctx.user.id, fromStatus: null, toStatus: "new" });
    }
    return { id: requestId ?? null, publicId, status: "new" as const };
  }),

  sendMessage: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(and(eq(serviceRequests.id, input.requestId), eq(serviceRequests.userId, ctx.user.id))).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    await db.insert(requestMessages).values({ requestId: request.id, senderUserId: ctx.user.id, senderRole: "customer", body: input.body, customerVisible: true });
    return { ok: true };
  }),

  notifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(100);
  }),

  markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await database();
    await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, input.notificationId), eq(notifications.userId, ctx.user.id)));
    return { ok: true };
  }),

  favorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select().from(favoriteStations).where(eq(favoriteStations.userId, ctx.user.id)).orderBy(desc(favoriteStations.createdAt));
  }),

  saveFavorite: protectedProcedure.input(z.object({ stationKey: z.string().trim().min(1).max(160), name: z.string().trim().min(1).max(180), address: z.string().trim().min(1).max(500), connectorTypes: z.array(z.enum(["CCS2", "Type 2"])).min(1).max(2) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    await db.insert(favoriteStations).values({ ...input, userId: ctx.user.id }).onDuplicateKeyUpdate({ set: { name: input.name, address: input.address, connectorTypes: input.connectorTypes } });
    return { ok: true };
  }),

  removeFavorite: protectedProcedure.input(z.object({ stationKey: z.string().trim().min(1).max(160) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    await db.delete(favoriteStations).where(and(eq(favoriteStations.userId, ctx.user.id), eq(favoriteStations.stationKey, input.stationKey)));
    return { ok: true };
  }),

  journeys: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select().from(savedJourneys).where(eq(savedJourneys.userId, ctx.user.id)).orderBy(desc(savedJourneys.createdAt)).limit(50);
  }),

  saveJourney: protectedProcedure.input(z.object({ origin: z.string().trim().min(2).max(240), destination: z.string().trim().min(2).max(240), distanceKm: z.number().positive().max(20000).optional(), durationMinutes: z.number().int().positive().max(100000).optional(), chargingStops: z.array(z.object({ name: z.string().max(180), address: z.string().max(500), sample: z.boolean() })).max(30).optional(), estimateSource: z.string().trim().max(80).default("estimate unavailable") })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const inserted = await db.insert(savedJourneys).values({ ...input, userId: ctx.user.id, chargingStops: input.chargingStops ?? [] }).$returningId();
    return { id: inserted[0]?.id ?? null };
  }),

  submitFeedback: protectedProcedure.input(z.object({ requestId: z.number().int().positive().optional().nullable(), rating: z.number().int().min(1).max(5), body: z.string().trim().max(4000).optional().default("") })).mutation(async ({ ctx, input }) => {
    const db = await database();
    if (input.requestId) {
      const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(and(eq(serviceRequests.id, input.requestId), eq(serviceRequests.userId, ctx.user.id))).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    }
    const inserted = await db.insert(feedback).values({ userId: ctx.user.id, requestId: input.requestId ?? null, rating: input.rating, body: input.body || null }).$returningId();
    return { id: inserted[0]?.id ?? null };
  }),

  feedback: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select().from(feedback).where(eq(feedback.userId, ctx.user.id)).orderBy(desc(feedback.createdAt)).limit(50);
  }),
});

export type RequestStatus = (typeof requestStatuses)[number];
