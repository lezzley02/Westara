import { and, count, desc, eq, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  feedback,
  notifications,
  requestMessages,
  requestNotes,
  requestStatuses,
  requestStatusEvents,
  serviceRequests,
  serviceSettings,
  teamMembers,
  users,
  vehicles,
} from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { adminProcedure, router } from "./_core/trpc";

const database = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable." });
  return db;
};

const requestFilterSchema = z.object({
  kind: z.enum(["roadside", "rental", "maintenance"]).optional(),
  status: z.enum(requestStatuses).optional(),
  search: z.string().trim().max(120).optional(),
}).optional();

export const adminRouter = router({
  overview: adminProcedure.query(async () => {
    const db = await database();
    const [usersCount, allRequests, newRequests, pendingRequests, completedRequests, recent] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(serviceRequests),
      db.select({ value: count() }).from(serviceRequests).where(eq(serviceRequests.status, "new")),
      db.select({ value: count() }).from(serviceRequests).where(eq(serviceRequests.status, "pending")),
      db.select({ value: count() }).from(serviceRequests).where(eq(serviceRequests.status, "completed")),
      db.select({ id: serviceRequests.id, publicId: serviceRequests.publicId, summary: serviceRequests.summary, kind: serviceRequests.kind, status: serviceRequests.status, createdAt: serviceRequests.createdAt, customerName: users.name }).from(serviceRequests).leftJoin(users, eq(serviceRequests.userId, users.id)).orderBy(desc(serviceRequests.createdAt)).limit(8),
    ]);
    return {
      totalUsers: Number(usersCount[0]?.value ?? 0),
      totalRequests: Number(allRequests[0]?.value ?? 0),
      newRequests: Number(newRequests[0]?.value ?? 0),
      pendingRequests: Number(pendingRequests[0]?.value ?? 0),
      completedRequests: Number(completedRequests[0]?.value ?? 0),
      recentActivity: recent,
    };
  }),

  requests: adminProcedure.input(requestFilterSchema).query(async ({ input }) => {
    const db = await database();
    const clauses = [];
    if (input?.kind) clauses.push(eq(serviceRequests.kind, input.kind));
    if (input?.status) clauses.push(eq(serviceRequests.status, input.status));
    if (input?.search) {
      const term = `%${input.search}%`;
      clauses.push(or(like(serviceRequests.publicId, term), like(serviceRequests.summary, term), like(users.name, term), like(users.email, term))!);
    }
    const query = db.select({
      request: serviceRequests,
      customerName: users.name,
      customerEmail: users.email,
      assigneeName: teamMembers.name,
    }).from(serviceRequests)
      .leftJoin(users, eq(serviceRequests.userId, users.id))
      .leftJoin(teamMembers, eq(serviceRequests.assignedTeamId, teamMembers.id))
      .orderBy(desc(serviceRequests.updatedAt)).limit(200);
    return clauses.length ? query.where(and(...clauses)) : query;
  }),

  requestDetail: adminProcedure.input(z.object({ requestId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await database();
    const [rows, messages, notes, events] = await Promise.all([
      db.select({ request: serviceRequests, customer: users, assignee: teamMembers }).from(serviceRequests)
        .leftJoin(users, eq(serviceRequests.userId, users.id))
        .leftJoin(teamMembers, eq(serviceRequests.assignedTeamId, teamMembers.id))
        .where(eq(serviceRequests.id, input.requestId)).limit(1),
      db.select({ message: requestMessages, senderName: users.name }).from(requestMessages)
        .leftJoin(users, eq(requestMessages.senderUserId, users.id))
        .where(eq(requestMessages.requestId, input.requestId)).orderBy(requestMessages.createdAt),
      db.select({ note: requestNotes, adminName: users.name }).from(requestNotes)
        .leftJoin(users, eq(requestNotes.adminUserId, users.id))
        .where(eq(requestNotes.requestId, input.requestId)).orderBy(requestNotes.createdAt),
      db.select().from(requestStatusEvents).where(eq(requestStatusEvents.requestId, input.requestId)).orderBy(requestStatusEvents.createdAt),
    ]);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    return { ...rows[0], messages, notes, events };
  }),

  setRequestStatus: adminProcedure.input(z.object({ requestId: z.number().int().positive(), status: z.enum(requestStatuses) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    if (request.status === input.status) return { ok: true };
    await db.update(serviceRequests).set({ status: input.status, updatedAt: new Date() }).where(eq(serviceRequests.id, request.id));
    await db.insert(requestStatusEvents).values({ requestId: request.id, actorUserId: ctx.user.id, fromStatus: request.status, toStatus: input.status });
    await db.insert(notifications).values({ userId: request.userId, requestId: request.id, kind: "status_update", title: "Request status updated", body: `${request.publicId} is now ${input.status.replaceAll("_", " ")}.` });
    return { ok: true };
  }),

  assignRequest: adminProcedure.input(z.object({ requestId: z.number().int().positive(), teamMemberId: z.number().int().positive().nullable() })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    if (input.teamMemberId) {
      const [member] = await db.select({ id: teamMembers.id }).from(teamMembers).where(and(eq(teamMembers.id, input.teamMemberId), eq(teamMembers.active, true))).limit(1);
      if (!member) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active team member." });
    }
    const nextStatus = input.teamMemberId && request.status === "pending" ? "assigned" : request.status;
    await db.update(serviceRequests).set({ assignedTeamId: input.teamMemberId, status: nextStatus, updatedAt: new Date() }).where(eq(serviceRequests.id, request.id));
    if (nextStatus !== request.status) {
      await db.insert(requestStatusEvents).values({ requestId: request.id, actorUserId: ctx.user.id, fromStatus: request.status, toStatus: nextStatus });
      await db.insert(notifications).values({ userId: request.userId, requestId: request.id, kind: "status_update", title: "Request assigned", body: `${request.publicId} has been assigned to our team.` });
    }
    return { ok: true };
  }),

  replyToRequest: adminProcedure.input(z.object({ requestId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    await db.insert(requestMessages).values({ requestId: request.id, senderUserId: ctx.user.id, senderRole: "admin", body: input.body, customerVisible: true });
    await db.insert(notifications).values({ userId: request.userId, requestId: request.id, kind: "request_reply", title: "Westara replied to your request", body: `There is a new reply for ${request.publicId}.` });
    return { ok: true };
  }),

  addPrivateNote: adminProcedure.input(z.object({ requestId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    await db.insert(requestNotes).values({ requestId: request.id, adminUserId: ctx.user.id, body: input.body });
    return { ok: true };
  }),

  teamMembers: adminProcedure.query(async () => {
    const db = await database();
    return db.select().from(teamMembers).orderBy(teamMembers.name);
  }),

  addTeamMember: adminProcedure.input(z.object({ name: z.string().trim().min(1).max(160), email: z.string().trim().email().max(320).optional().or(z.literal("")) })).mutation(async ({ input }) => {
    const db = await database();
    const inserted = await db.insert(teamMembers).values({ name: input.name, email: input.email || null, active: true }).$returningId();
    return { id: inserted[0]?.id ?? null };
  }),

  setTeamMemberActive: adminProcedure.input(z.object({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ input }) => {
    const db = await database();
    await db.update(teamMembers).set({ active: input.active, updatedAt: new Date() }).where(eq(teamMembers.id, input.id));
    return { ok: true };
  }),

  customers: adminProcedure.input(z.object({ search: z.string().trim().max(120).optional() }).optional()).query(async ({ input }) => {
    const db = await database();
    const base = db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, createdAt: users.createdAt }).from(users).where(eq(users.role, "user")).orderBy(desc(users.createdAt)).limit(200);
    if (!input?.search) return base;
    const term = `%${input.search}%`;
    return db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, createdAt: users.createdAt }).from(users).where(and(eq(users.role, "user"), or(like(users.name, term), like(users.email, term), like(users.city, term))!)).orderBy(desc(users.createdAt)).limit(200);
  }),

  customerDetail: adminProcedure.input(z.object({ userId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await database();
    const [customerRows, vehicleRows, requestRows] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.id, input.userId)).limit(1),
      db.select().from(vehicles).where(eq(vehicles.userId, input.userId)).orderBy(desc(vehicles.createdAt)),
      db.select().from(serviceRequests).where(eq(serviceRequests.userId, input.userId)).orderBy(desc(serviceRequests.createdAt)).limit(100),
    ]);
    if (!customerRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found." });
    return { customer: customerRows[0], vehicles: vehicleRows, requests: requestRows };
  }),

  feedback: adminProcedure.query(async () => {
    const db = await database();
    return db.select({ entry: feedback, customerName: users.name, customerEmail: users.email }).from(feedback).leftJoin(users, eq(feedback.userId, users.id)).orderBy(desc(feedback.createdAt)).limit(200);
  }),

  replyToFeedback: adminProcedure.input(z.object({ feedbackId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ input }) => {
    const db = await database();
    const [entry] = await db.select().from(feedback).where(eq(feedback.id, input.feedbackId)).limit(1);
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
    await db.update(feedback).set({ adminReply: input.body, repliedAt: new Date() }).where(eq(feedback.id, entry.id));
    await db.insert(notifications).values({ userId: entry.userId, requestId: entry.requestId, kind: "feedback_reply", title: "Westara replied to your feedback", body: "There is a response to your feedback in your account." });
    return { ok: true };
  }),

  settings: adminProcedure.query(async () => {
    const db = await database();
    return db.select().from(serviceSettings).orderBy(serviceSettings.settingKey);
  }),

  saveSetting: adminProcedure.input(z.object({ key: z.string().trim().min(1).max(120), value: z.string().max(8000) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    await db.insert(serviceSettings).values({ settingKey: input.key, value: input.value, updatedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { value: input.value, updatedByUserId: ctx.user.id, updatedAt: new Date() } });
    return { ok: true };
  }),

  administrators: adminProcedure.query(async () => {
    const db = await database();
    const rows = await db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.role, "admin")).orderBy(users.createdAt);
    return rows.map(({ openId, ...admin }) => ({ ...admin, isOwner: Boolean(ENV.ownerOpenId && openId === ENV.ownerOpenId) }));
  }),

  setAdministrator: adminProcedure.input(z.object({ userId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const [target] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    if (!input.enabled && ENV.ownerOpenId && target.openId === ENV.ownerOpenId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "The configured owner administrator cannot be removed." });
    }
    if (!input.enabled && target.id === ctx.user.id) {
      const [admins] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
      if (Number(admins?.value ?? 0) <= 1) throw new TRPCError({ code: "BAD_REQUEST", message: "At least one administrator must remain." });
    }
    await db.update(users).set({ role: input.enabled ? "admin" : "user" }).where(eq(users.id, target.id));
    return { ok: true };
  }),
});
