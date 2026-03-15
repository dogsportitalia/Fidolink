import { 
  users, 
  tags, 
  dogProfiles, 
  scanEvents,
  pageVisits,
  locationLinks,
  type User, 
  type InsertUser, 
  type Tag,
  type InsertTag,
  type DogProfile,
  type InsertDogProfile,
  type UpdateDogProfile,
  type ScanEvent,
  type InsertScanEvent,
  type TagWithProfile,
  type ScanEventWithTag,
  type PageVisit,
  type LocationLink,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lt, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string): Promise<User>;
  setResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(userId: number): Promise<void>;
  updatePassword(userId: number, passwordHash: string): Promise<void>;

  // Tags
  createTag(publicId: string, claimCodeHash: string): Promise<Tag>;
  getTagByPublicId(publicId: string): Promise<Tag | undefined>;
  getTagById(id: number): Promise<Tag | undefined>;
  getTagsByOwnerId(ownerId: number): Promise<TagWithProfile[]>;
  getAllTags(): Promise<TagWithProfile[]>;
  claimTag(tagId: number, ownerId: number): Promise<Tag>;
  getUnclaimedTags(): Promise<Tag[]>;
  extendTagExpiration(tagId: number, years?: number): Promise<Tag | undefined>;
  searchTags(query: string): Promise<Array<{
    tag: Tag;
    dogProfile: DogProfile | null;
    ownerEmail: string | null;
  }>>;

  // Dog Profiles
  createDogProfile(data: InsertDogProfile): Promise<DogProfile>;
  getDogProfileByTagId(tagId: number): Promise<DogProfile | undefined>;
  updateDogProfile(tagId: number, data: UpdateDogProfile): Promise<DogProfile | undefined>;

  // Scan Events
  createScanEvent(data: InsertScanEvent): Promise<ScanEvent>;
  getScanEventsByTagId(tagId: number): Promise<ScanEvent[]>;
  getRecentScans(limit?: number): Promise<ScanEventWithTag[]>;
  countRecentScansByIpAndTag(ipHash: string, tagId: number, sinceMinutes: number): Promise<number>;
  deleteOldScanEvents(daysOld: number): Promise<number>;

  // Admin
  getAllUsersWithTags(): Promise<Array<{
    id: number;
    email: string;
    createdAt: Date;
    tags: Array<{ publicId: string; dogName: string | null; claimedAt: Date | null }>;
  }>>;

  // Page Visits
  recordVisit(): Promise<void>;
  getVisitStats(days?: number): Promise<{ date: string; count: number }[]>;
  getTotalVisits(): Promise<number>;

  // Location Links
  createLocationLink(token: string, latitude: number, longitude: number, dogName?: string): Promise<LocationLink>;
  getLocationLinkByToken(token: string): Promise<LocationLink | undefined>;
  deleteExpiredLocationLinks(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning();
    return user;
  }

  async setResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    return user || undefined;
  }

  async clearResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }

  // Tags
  async createTag(publicId: string, claimCodeHash: string): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values({ publicId, claimCodeHash })
      .returning();
    return tag;
  }

  async getTagByPublicId(publicId: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.publicId, publicId));
    return tag || undefined;
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async getTagsByOwnerId(ownerId: number): Promise<TagWithProfile[]> {
    const result = await db
      .select()
      .from(tags)
      .leftJoin(dogProfiles, eq(tags.id, dogProfiles.tagId))
      .where(eq(tags.ownerId, ownerId))
      .orderBy(desc(tags.claimedAt));

    return result.map((row) => ({
      ...row.tags,
      dogProfile: row.dog_profiles || null,
    }));
  }

  async getAllTags(): Promise<TagWithProfile[]> {
    const result = await db
      .select()
      .from(tags)
      .leftJoin(dogProfiles, eq(tags.id, dogProfiles.tagId))
      .orderBy(desc(tags.createdAt));

    return result.map((row) => ({
      ...row.tags,
      dogProfile: row.dog_profiles || null,
    }));
  }

  async claimTag(tagId: number, ownerId: number): Promise<Tag> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);
    
    const [tag] = await db
      .update(tags)
      .set({ ownerId, claimedAt: now, expiresAt })
      .where(eq(tags.id, tagId))
      .returning();
    return tag;
  }

  async extendTagExpiration(tagId: number, years: number = 2): Promise<Tag | undefined> {
    const tag = await this.getTagById(tagId);
    if (!tag) return undefined;

    const baseDate = tag.expiresAt && tag.expiresAt > new Date() 
      ? tag.expiresAt 
      : new Date();
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + years);
    
    const [updatedTag] = await db
      .update(tags)
      .set({ expiresAt: newExpiresAt })
      .where(eq(tags.id, tagId))
      .returning();
    return updatedTag;
  }

  async searchTags(query: string): Promise<Array<{
    tag: Tag;
    dogProfile: DogProfile | null;
    ownerEmail: string | null;
  }>> {
    const searchQuery = `%${query.toUpperCase()}%`;
    const emailQuery = `%${query.toLowerCase()}%`;
    
    const result = await db
      .select()
      .from(tags)
      .leftJoin(dogProfiles, eq(tags.id, dogProfiles.tagId))
      .leftJoin(users, eq(tags.ownerId, users.id))
      .where(
        sql`UPPER(${tags.publicId}) LIKE ${searchQuery} OR LOWER(${users.email}) LIKE ${emailQuery}`
      )
      .orderBy(desc(tags.claimedAt))
      .limit(50);

    return result.map((row) => ({
      tag: row.tags,
      dogProfile: row.dog_profiles || null,
      ownerEmail: row.users?.email || null,
    }));
  }

  async getUnclaimedTags(): Promise<Tag[]> {
    return db
      .select()
      .from(tags)
      .where(sql`${tags.ownerId} IS NULL`);
  }

  // Dog Profiles
  async createDogProfile(data: InsertDogProfile): Promise<DogProfile> {
    const [profile] = await db
      .insert(dogProfiles)
      .values(data)
      .returning();
    return profile;
  }

  async getDogProfileByTagId(tagId: number): Promise<DogProfile | undefined> {
    const [profile] = await db
      .select()
      .from(dogProfiles)
      .where(eq(dogProfiles.tagId, tagId));
    return profile || undefined;
  }

  async updateDogProfile(tagId: number, data: UpdateDogProfile): Promise<DogProfile | undefined> {
    const existing = await this.getDogProfileByTagId(tagId);
    
    if (existing) {
      const [profile] = await db
        .update(dogProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(dogProfiles.tagId, tagId))
        .returning();
      return profile;
    } else {
      // Create new profile
      const [profile] = await db
        .insert(dogProfiles)
        .values({ 
          tagId, 
          name: data.name || "Senza nome",
          ...data 
        })
        .returning();
      return profile;
    }
  }

  // Scan Events
  async createScanEvent(data: InsertScanEvent): Promise<ScanEvent> {
    const [event] = await db
      .insert(scanEvents)
      .values(data)
      .returning();
    return event;
  }

  async getScanEventsByTagId(tagId: number): Promise<ScanEvent[]> {
    return db
      .select()
      .from(scanEvents)
      .where(eq(scanEvents.tagId, tagId))
      .orderBy(desc(scanEvents.createdAt));
  }

  async getRecentScans(limit = 50): Promise<ScanEventWithTag[]> {
    const result = await db
      .select()
      .from(scanEvents)
      .innerJoin(tags, eq(scanEvents.tagId, tags.id))
      .leftJoin(dogProfiles, eq(tags.id, dogProfiles.tagId))
      .orderBy(desc(scanEvents.createdAt))
      .limit(limit);

    return result.map((row) => ({
      ...row.scan_events,
      tag: {
        ...row.tags,
        dogProfile: row.dog_profiles || null,
      },
    }));
  }

  async countRecentScansByIpAndTag(ipHash: string, tagId: number, sinceMinutes: number): Promise<number> {
    const sinceTime = new Date(Date.now() - sinceMinutes * 60 * 1000);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(scanEvents)
      .where(
        and(
          eq(scanEvents.ipHash, ipHash),
          eq(scanEvents.tagId, tagId),
          gte(scanEvents.createdAt, sinceTime)
        )
      );

    return Number(result[0]?.count || 0);
  }

  async deleteOldScanEvents(daysOld: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const deleted = await db
      .delete(scanEvents)
      .where(lt(scanEvents.createdAt, cutoffDate))
      .returning({ id: scanEvents.id });

    return deleted.length;
  }

  // Admin
  async getAllUsersWithTags(): Promise<Array<{
    id: number;
    email: string;
    createdAt: Date;
    tags: Array<{ publicId: string; dogName: string | null; claimedAt: Date | null }>;
  }>> {
    const rows = await db
      .select()
      .from(users)
      .leftJoin(tags, eq(tags.ownerId, users.id))
      .leftJoin(dogProfiles, eq(tags.id, dogProfiles.tagId))
      .orderBy(desc(users.createdAt));

    const usersMap = new Map<number, {
      id: number;
      email: string;
      createdAt: Date;
      tags: Array<{ publicId: string; dogName: string | null; claimedAt: Date | null }>;
    }>();

    for (const row of rows) {
      if (!usersMap.has(row.users.id)) {
        usersMap.set(row.users.id, {
          id: row.users.id,
          email: row.users.email,
          createdAt: row.users.createdAt,
          tags: [],
        });
      }
      if (row.tags) {
        usersMap.get(row.users.id)!.tags.push({
          publicId: row.tags.publicId,
          dogName: row.dog_profiles?.name || null,
          claimedAt: row.tags.claimedAt,
        });
      }
    }

    return Array.from(usersMap.values());
  }

  // Page Visits
  async recordVisit(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await db
      .insert(pageVisits)
      .values({ date: today, count: 1 })
      .onConflictDoUpdate({
        target: pageVisits.date,
        set: { count: sql`${pageVisits.count} + 1` },
      });
  }

  async getVisitStats(days: number = 30): Promise<{ date: string; count: number }[]> {
    const result = await db
      .select()
      .from(pageVisits)
      .orderBy(desc(pageVisits.date));

    const visitMap = new Map(result.map(r => [r.date, r.count]));
    
    const stats: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      stats.push({
        date: dateStr,
        count: visitMap.get(dateStr) || 0,
      });
    }
    
    return stats;
  }

  async getTotalVisits(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${pageVisits.count}), 0)` })
      .from(pageVisits);

    return Number(result[0]?.total || 0);
  }

  // Location Links
  async createLocationLink(token: string, latitude: number, longitude: number, dogName?: string): Promise<LocationLink> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const [link] = await db
      .insert(locationLinks)
      .values({ token, latitude, longitude, dogName: dogName || null, expiresAt })
      .returning();
    return link;
  }

  async getLocationLinkByToken(token: string): Promise<LocationLink | undefined> {
    const [link] = await db
      .select()
      .from(locationLinks)
      .where(eq(locationLinks.token, token));
    return link || undefined;
  }

  async deleteExpiredLocationLinks(): Promise<number> {
    const now = new Date();
    const deleted = await db
      .delete(locationLinks)
      .where(lt(locationLinks.expiresAt, now))
      .returning({ id: locationLinks.id });
    return deleted.length;
  }

  // Reset all data (admin)
  async resetAllData(): Promise<void> {
    await db.delete(scanEvents);
    await db.delete(locationLinks);
    await db.delete(dogProfiles);
    await db.delete(pageVisits);
    await db.delete(tags);
    await db.delete(users);
  }
}

export const storage = new DatabaseStorage();
