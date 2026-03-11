import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - owners who claim tags
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const usersRelations = relations(users, ({ many }) => ({
  tags: many(tags),
}));

// Tags table - the QR medagliette
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("public_id").notNull().unique(),
  claimCodeHash: text("claim_code_hash").notNull(),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  claimedAt: integer("claimed_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const tagsRelations = relations(tags, ({ one, many }) => ({
  owner: one(users, {
    fields: [tags.ownerId],
    references: [users.id],
  }),
  dogProfile: one(dogProfiles),
  scanEvents: many(scanEvents),
}));

// Dog profiles - info about the dog linked to a tag
export const dogProfiles = sqliteTable("dog_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tagId: integer("tag_id").references(() => tags.id).notNull().unique(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  breed: text("breed"),
  sex: text("sex"),
  size: text("size"),
  birthdate: text("birthdate"),
  medicalNotes: text("medical_notes"),
  instructionsText: text("instructions_text"),
  contactPhone: text("contact_phone"),
  contactWhatsapp: text("contact_whatsapp"),
  contactEmail: text("contact_email"),
  showPhone: integer("show_phone", { mode: "boolean" }).default(true).notNull(),
  showWhatsapp: integer("show_whatsapp", { mode: "boolean" }).default(true).notNull(),
  showEmail: integer("show_email", { mode: "boolean" }).default(false).notNull(),
  notifyOnScan: integer("notify_on_scan", { mode: "boolean" }).default(true).notNull(),
  city: text("city"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const dogProfilesRelations = relations(dogProfiles, ({ one }) => ({
  tag: one(tags, {
    fields: [dogProfiles.tagId],
    references: [tags.id],
  }),
}));

// Scan events - logs when someone scans a tag
export const scanEvents = sqliteTable("scan_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  tag: one(tags, {
    fields: [scanEvents.tagId],
    references: [tags.id],
  }),
}));

// Page visits - simple daily visit counter (no personal data)
export const pageVisits = sqliteTable("page_visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  count: integer("count").default(0).notNull(),
});

// Location links - temporary GPS position links with 30-day expiration
export const locationLinks = sqliteTable("location_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  dogName: text("dog_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
}).extend({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
});

export const insertTagSchema = createInsertSchema(tags).pick({
  publicId: true,
  claimCodeHash: true,
});

export const insertDogProfileSchema = createInsertSchema(dogProfiles).omit({
  id: true,
  updatedAt: true,
});

export const updateDogProfileSchema = createInsertSchema(dogProfiles).omit({
  id: true,
  tagId: true,
  updatedAt: true,
}).partial();

export const insertScanEventSchema = createInsertSchema(scanEvents).omit({
  id: true,
  createdAt: true,
});

// Claim schema
export const claimTagSchema = z.object({
  claimCode: z.string().regex(/^DS-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Formato codice non valido (es: DS-XXXX-XXXX)"),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

export const signupSchema = insertUserSchema;

// Password reset schemas
export const requestResetSchema = z.object({
  email: z.string().email("Email non valida"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token richiesto"),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
});

// Contact form schema
export const contactFormSchema = z.object({
  email: z.string().email("Email non valida"),
  message: z.string().min(10, "Messaggio troppo breve (minimo 10 caratteri)").max(2000, "Messaggio troppo lungo (massimo 2000 caratteri)"),
});

// Scan request schema (for GPS coordinates)
export const scanRequestSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => {
    const hasLat = data.latitude !== undefined;
    const hasLng = data.longitude !== undefined;
    return hasLat === hasLng;
  },
  { message: "Entrambe le coordinate devono essere fornite o nessuna" }
);

export type ScanRequest = z.infer<typeof scanRequestSchema>;

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type DogProfile = typeof dogProfiles.$inferSelect;
export type InsertDogProfile = z.infer<typeof insertDogProfileSchema>;
export type UpdateDogProfile = z.infer<typeof updateDogProfileSchema>;
export type ScanEvent = typeof scanEvents.$inferSelect;
export type InsertScanEvent = z.infer<typeof insertScanEventSchema>;

// Extended types for frontend
export type TagWithProfile = Tag & {
  dogProfile: DogProfile | null;
};

export type PublicDogInfo = {
  name: string;
  photoUrl: string | null;
  breed: string | null;
  sex: string | null;
  size: string | null;
  medicalNotes: string | null;
  instructionsText: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  city: string | null;
};

export type ScanEventWithTag = ScanEvent & {
  tag: Tag & {
    dogProfile: DogProfile | null;
  };
};

export type PageVisit = typeof pageVisits.$inferSelect;

export type LocationLink = typeof locationLinks.$inferSelect;
export type InsertLocationLink = typeof locationLinks.$inferInsert;
