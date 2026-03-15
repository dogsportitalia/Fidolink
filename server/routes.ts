import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  signupSchema, 
  claimTagSchema, 
  updateDogProfileSchema,
  requestResetSchema,
  resetPasswordSchema,
  contactFormSchema,
  scanRequestSchema,
  type PublicDogInfo 
} from "@shared/schema";
import { 
  generatePublicId, 
  generateClaimCode, 
  hashClaimCode, 
  verifyClaimCode,
  hashPassword, 
  verifyPassword,
  hashIp,
  getClientIp,
  generateToken,
  verifyToken 
} from "./utils";
import { sendOwnerNotification, sendWelcomeEmail, sendPasswordResetEmail, sendContactEmail } from "./email";
import { uploadDogPhoto } from "./cloudinary";
import crypto from "crypto";
import fs from "fs";
import { dbPath } from "./db";
import { z } from "zod";

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Non autenticato" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Token non valido" });
  }

  (req as any).userId = payload.userId;
  next();
}

// Rate limit store (in-memory for simplicity)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = rateLimits.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxAttempts) {
    return false;
  }

  existing.count++;
  return true;
}

function checkScanRateLimit(ipHash: string, tagId: number): boolean {
  return checkRateLimit(`scan:${ipHash}:${tagId}`, 10, 60 * 60 * 1000);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Cookie parser middleware
  const cookieParser = await import("cookie-parser");
  app.use(cookieParser.default());

  // ============ AUTH ROUTES ============

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const clientIp = getClientIp(req);
      if (!checkRateLimit(`signup:${clientIp}`, 5, 15 * 60 * 1000)) {
        return res.status(429).json({ message: "Troppi tentativi di registrazione. Riprova tra qualche minuto." });
      }

      const data = signupSchema.parse(req.body);

      // Check if user already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser(data.email, passwordHash);

      // Send welcome email (async, don't wait)
      sendWelcomeEmail(data.email).catch(console.error);

      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ id: user.id, email: user.email });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const clientIp = getClientIp(req);
      if (!checkRateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000)) {
        return res.status(429).json({ message: "Troppi tentativi di accesso. Riprova tra qualche minuto." });
      }

      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }

      const validPassword = await verifyPassword(data.password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }

      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ id: user.id, email: user.email });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Errore durante l'accesso" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  // Request password reset
  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const data = requestResetSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: "Se l'email esiste, riceverai le istruzioni per il reset" });
      }

      // Clear any existing reset token first (invalidate previous requests)
      await storage.clearResetToken(user.id);

      // Generate new reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setResetToken(user.id, resetToken, expiry);
      
      // Send reset email
      await sendPasswordResetEmail(data.email, resetToken);

      res.json({ success: true, message: "Se l'email esiste, riceverai le istruzioni per il reset" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Email non valida" });
      }
      console.error("Request reset error:", error);
      res.status(500).json({ message: "Errore durante la richiesta" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByResetToken(data.token);
      
      if (!user) {
        return res.status(400).json({ message: "Link non valido o scaduto" });
      }

      // Check if token is expired
      if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
        await storage.clearResetToken(user.id);
        return res.status(400).json({ message: "Link scaduto. Richiedi un nuovo reset" });
      }

      // Update password
      const passwordHash = await hashPassword(data.password);
      await storage.updatePassword(user.id, passwordHash);
      await storage.clearResetToken(user.id);

      res.json({ success: true, message: "Password aggiornata con successo" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Errore durante il reset" });
    }
  });

  // Get current user
  app.get("/api/me", async (req, res) => {
    try {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token non valido" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "Utente non trovato" });
      }

      res.json({ id: user.id, email: user.email });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // ============ TAG ROUTES ============

  // Get user's tags
  app.get("/api/tags", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const tags = await storage.getTagsByOwnerId(userId);
      res.json(tags);
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({ message: "Errore nel recupero delle medagliette" });
    }
  });

  // Claim a tag
  app.post("/api/tags/claim", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const data = claimTagSchema.parse(req.body);
      
      // Get all unclaimed tags and verify the claim code against each
      const unclaimedTags = await storage.getUnclaimedTags();

      let matchedTag = null;
      for (const tag of unclaimedTags) {
        const isMatch = await verifyClaimCode(data.claimCode, tag.claimCodeHash);
        if (isMatch) {
          matchedTag = tag;
          break;
        }
      }

      if (!matchedTag) {
        return res.status(400).json({ message: "Codice non valido o già utilizzato" });
      }

      // Claim the tag
      const claimedTag = await storage.claimTag(matchedTag.id, userId);
      
      // Create initial dog profile
      await storage.updateDogProfile(matchedTag.id, { name: "Nuovo cane" });

      res.json(claimedTag);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Codice non valido" });
      }
      console.error("Claim tag error:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Get public tag info
  app.get("/api/tags/:publicId/public", async (req, res) => {
    try {
      const { publicId } = req.params;
      
      const tag = await storage.getTagByPublicId(publicId);
      if (!tag || !tag.ownerId) {
        return res.status(404).json({ message: "Medaglietta non trovata" });
      }

      const profile = await storage.getDogProfileByTagId(tag.id);
      if (!profile) {
        return res.status(404).json({ message: "Profilo non trovato" });
      }

      const publicInfo: PublicDogInfo = {
        name: profile.name,
        photoUrl: profile.photoUrl,
        breed: profile.breed,
        sex: profile.sex,
        size: profile.size,
        medicalNotes: profile.medicalNotes,
        instructionsText: profile.instructionsText,
        contactPhone: profile.showPhone ? profile.contactPhone : null,
        contactWhatsapp: profile.showWhatsapp ? profile.contactWhatsapp : null,
        contactEmail: profile.showEmail ? profile.contactEmail : null,
        showPhone: profile.showPhone,
        showWhatsapp: profile.showWhatsapp,
        showEmail: profile.showEmail,
        city: profile.city,
      };

      res.json(publicInfo);
    } catch (error) {
      console.error("Get public tag error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Log scan event
  app.post("/api/tags/:publicId/scan", async (req, res) => {
    try {
      const { publicId } = req.params;
      const clientIp = getClientIp(req);
      const ipHash = hashIp(clientIp);
      const userAgent = req.headers["user-agent"] || null;

      // Validate GPS coordinates using Zod schema
      const scanData = scanRequestSchema.parse(req.body);
      const validLat = scanData.latitude ?? null;
      const validLng = scanData.longitude ?? null;

      const tag = await storage.getTagByPublicId(publicId);
      if (!tag || !tag.ownerId) {
        return res.status(404).json({ message: "Medaglietta non trovata" });
      }

      // Rate limiting
      if (!checkScanRateLimit(ipHash, tag.id)) {
        return res.status(429).json({ message: "Troppe richieste. Riprova più tardi." });
      }

      // Create scan event with GPS data if available
      await storage.createScanEvent({
        tagId: tag.id,
        ipHash,
        userAgent,
        latitude: validLat,
        longitude: validLng,
      });

      // Get profile and owner for notifications
      const profile = await storage.getDogProfileByTagId(tag.id);
      const owner = await storage.getUser(tag.ownerId);

      // Create location link if GPS coordinates are available
      let locationUrl: string | undefined;
      if (validLat !== null && validLng !== null) {
        const locationToken = crypto.randomBytes(32).toString('hex');
        await storage.createLocationLink(locationToken, validLat, validLng, profile?.name);
        const baseUrl = process.env.APP_URL || 'https://fidolink.it';
        locationUrl = `${baseUrl}/location/${locationToken}`;
      }

      const notificationData = {
        publicId,
        dogName: profile?.name || "Sconosciuto",
        scanTime: new Date(),
        userAgent: userAgent || undefined,
        city: profile?.city || undefined,
        locationUrl,
      };

      // Send owner notification if enabled
      if (profile?.notifyOnScan && owner?.email) {
        sendOwnerNotification(owner.email, notificationData).catch(console.error);
      }

      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      console.error("Log scan error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Update dog profile
  app.put("/api/tags/:tagId/profile", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const tagIdParam = req.params.tagId as string;
      const tagId = parseInt(tagIdParam);

      if (isNaN(tagId)) {
        return res.status(400).json({ message: "ID non valido" });
      }

      const tag = await storage.getTagById(tagId);
      if (!tag || tag.ownerId !== userId) {
        return res.status(403).json({ message: "Non autorizzato" });
      }

      const data = updateDogProfileSchema.parse(req.body);
      const profile = await storage.updateDogProfile(tagId, data);

      res.json(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Errore durante il salvataggio" });
    }
  });

  // ============ PHOTO UPLOAD ROUTE ============

  app.post("/api/upload/photo", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { imageData, tagId: tagIdRaw } = req.body;

      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({ message: "Immagine mancante" });
      }
      if (!imageData.startsWith("data:image/")) {
        return res.status(400).json({ message: "Formato immagine non valido" });
      }

      // Check size (~500KB max in base64)
      const base64Size = imageData.length * 0.75;
      if (base64Size > 600 * 1024) {
        return res.status(400).json({ message: "Immagine troppo grande (max 500KB)" });
      }

      // Verify tag ownership
      const tagId = parseInt(tagIdRaw);
      if (isNaN(tagId)) {
        return res.status(400).json({ message: "Tag non valido" });
      }
      const tag = await storage.getTagById(tagId);
      if (!tag || tag.ownerId !== userId) {
        return res.status(403).json({ message: "Non autorizzato" });
      }

      const url = await uploadDogPhoto(imageData, tag.publicId);
      res.json({ url });
    } catch (error: any) {
      console.error("Upload photo error:", error);
      res.status(500).json({ message: "Errore durante l'upload della foto" });
    }
  });

  // ============ CONTACT FORM ROUTE ============

  // Simple rate limiting for contact form
  const contactRateLimits = new Map<string, { count: number; resetAt: number }>();

  app.post("/api/contact", async (req, res) => {
    try {
      const clientIp = getClientIp(req);
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;
      
      // Rate limit: max 5 messages per hour per IP
      const existing = contactRateLimits.get(clientIp);
      if (existing && now < existing.resetAt && existing.count >= 5) {
        return res.status(429).json({ message: "Troppi messaggi inviati. Riprova più tardi." });
      }
      
      if (!existing || now > existing.resetAt) {
        contactRateLimits.set(clientIp, { count: 1, resetAt: now + hourMs });
      } else {
        existing.count++;
      }

      const data = contactFormSchema.parse(req.body);
      
      const sent = await sendContactEmail(data.email, data.message);
      
      if (!sent) {
        return res.status(500).json({ message: "Errore nell'invio del messaggio. Riprova più tardi." });
      }

      res.json({ success: true, message: "Messaggio inviato con successo!" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Errore durante l'invio" });
    }
  });

  // ============ ADMIN ROUTES ============

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    console.warn("WARNING: ADMIN_PASSWORD not set. Admin panel will be inaccessible.");
  }

  // Rate limiting for admin login
  const adminLoginAttempts = new Map<string, { count: number; blockedUntil: number }>();

  function checkAdminRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const record = adminLoginAttempts.get(ip);

    if (record && record.blockedUntil > 0) {
      if (now < record.blockedUntil) {
        const remainingTime = Math.ceil((record.blockedUntil - now) / 1000 / 60);
        return { allowed: false, remainingTime };
      }
      // Block expired, reset
      adminLoginAttempts.delete(ip);
    }
    return { allowed: true };
  }

  function recordFailedAttempt(ip: string): { blocked: boolean; remainingAttempts: number } {
    const now = Date.now();
    const record = adminLoginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
    
    record.count++;
    
    if (record.count >= 4) {
      record.blockedUntil = now + 30 * 60 * 1000; // 30 minuti
      adminLoginAttempts.set(ip, record);
      return { blocked: true, remainingAttempts: 0 };
    }
    
    adminLoginAttempts.set(ip, record);
    return { blocked: false, remainingAttempts: 4 - record.count };
  }

  function clearFailedAttempts(ip: string) {
    adminLoginAttempts.delete(ip);
  }

  // Verify admin password
  app.post("/api/admin/verify", async (req, res) => {
    try {
      const ip = getClientIp(req);
      const ipHash = hashIp(ip);
      
      const rateCheck = checkAdminRateLimit(ipHash);
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          message: `Troppi tentativi. Riprova tra ${rateCheck.remainingTime} minuti.`,
          blockedMinutes: rateCheck.remainingTime
        });
      }
      
      const { password } = req.body;
      
      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        const attempt = recordFailedAttempt(ipHash);
        if (attempt.blocked) {
          return res.status(429).json({
            message: "Troppi tentativi. Riprova tra 30 minuti.",
            blockedMinutes: 30
          });
        }
        return res.status(401).json({
          message: "Password non valida",
          remainingAttempts: attempt.remainingAttempts
        });
      }
      
      clearFailedAttempts(ipHash);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin verify error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Generate batch of tags
  app.post("/api/admin/batch", async (req, res) => {
    try {
      const { count, adminPassword } = req.body;

      if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const n = Math.min(Math.max(parseInt(count) || 10, 1), 100);
      
      const results: { publicId: string; claimCode: string }[] = [];
      
      for (let i = 0; i < n; i++) {
        const publicId = generatePublicId();
        const claimCode = generateClaimCode();
        const claimCodeHash = await hashClaimCode(claimCode);
        
        await storage.createTag(publicId, claimCodeHash);
        
        results.push({ publicId, claimCode });
      }

      // Generate CSV
      const csv = "publicId,claimCode\n" + results.map(r => `${r.publicId},${r.claimCode}`).join("\n");

      res.type("text/csv").send(csv);
    } catch (error) {
      console.error("Batch generation error:", error);
      res.status(500).json({ message: "Errore durante la generazione" });
    }
  });

  // Get recent scans
  app.get("/api/admin/scans", async (req, res) => {
    try {
      const password = req.query.password as string | undefined;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const scans = await storage.getRecentScans(100);
      res.json(scans);
    } catch (error) {
      console.error("Get scans error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Get all tags for QR code generation
  app.get("/api/admin/tags", async (req, res) => {
    try {
      const password = req.query.password as string | undefined;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const tags = await storage.getAllTags();
      const result = tags.map(tag => ({
        publicId: tag.publicId,
        dogName: tag.dogProfile?.name || null,
      }));
      res.json(result);
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Get all users with their tags
  app.get("/api/admin/users", async (req, res) => {
    try {
      const password = req.query.password as string | undefined;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const usersWithTags = await storage.getAllUsersWithTags();
      res.json(usersWithTags);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Search tags by publicId or owner email
  app.get("/api/admin/tags/search", async (req, res) => {
    try {
      const password = req.query.password as string | undefined;
      const query = req.query.q as string | undefined;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Ricerca troppo corta (minimo 2 caratteri)" });
      }

      const results = await storage.searchTags(query.trim());
      res.json(results);
    } catch (error) {
      console.error("Search tags error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Get full profile details for admin review (no notifications triggered)
  app.get("/api/admin/profile/:publicId", async (req, res) => {
    try {
      const password = req.query.password as string | undefined;
      const { publicId } = req.params;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const tag = await storage.getTagByPublicId(publicId);
      if (!tag) {
        return res.status(404).json({ message: "Medaglietta non trovata" });
      }

      const profile = tag.ownerId ? await storage.getDogProfileByTagId(tag.id) : null;
      const owner = tag.ownerId ? await storage.getUser(tag.ownerId) : null;

      res.json({
        tag: {
          id: tag.id,
          publicId: tag.publicId,
          claimedAt: tag.claimedAt,
          expiresAt: tag.expiresAt,
        },
        profile: profile ? {
          name: profile.name,
          photoUrl: profile.photoUrl,
          breed: profile.breed,
          sex: profile.sex,
          size: profile.size,
          birthdate: profile.birthdate,
          medicalNotes: profile.medicalNotes,
          instructionsText: profile.instructionsText,
          contactPhone: profile.contactPhone,
          contactWhatsapp: profile.contactWhatsapp,
          contactEmail: profile.contactEmail,
          showPhone: profile.showPhone,
          showWhatsapp: profile.showWhatsapp,
          showEmail: profile.showEmail,
          notifyOnScan: profile.notifyOnScan,
          city: profile.city,
          updatedAt: profile.updatedAt,
        } : null,
        ownerEmail: owner?.email || null,
      });
    } catch (error) {
      console.error("Get admin profile error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Extend tag expiration (reactivate)
  app.post("/api/admin/tags/:tagId/extend", async (req, res) => {
    try {
      const { adminPassword, years } = req.body;
      const tagId = parseInt(req.params.tagId);

      if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      if (isNaN(tagId)) {
        return res.status(400).json({ message: "ID medaglietta non valido" });
      }

      const tag = await storage.extendTagExpiration(tagId, years || 2);
      if (!tag) {
        return res.status(404).json({ message: "Medaglietta non trovata" });
      }

      res.json({ 
        message: "Medaglietta riattivata con successo", 
        tag,
        newExpiresAt: tag.expiresAt 
      });
    } catch (error) {
      console.error("Extend tag error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // ============ VISIT TRACKING ============

  // Record a page visit (called from frontend)
  app.post("/api/visit", async (req, res) => {
    try {
      await storage.recordVisit();
      res.json({ success: true });
    } catch (error) {
      console.error("Record visit error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // Get visit stats (admin only)
  app.get("/api/admin/visits", async (req, res) => {
    try {
      const password = req.query.password as string;
      const days = parseInt(req.query.days as string) || 30;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const stats = await storage.getVisitStats(days);
      const total = await storage.getTotalVisits();
      
      const today = new Date().toISOString().split('T')[0];
      const todayStats = stats.find(s => s.date === today);
      const todayCount = todayStats?.count || 0;
      
      const avgDaily = stats.length > 0 
        ? Math.round(stats.reduce((sum, s) => sum + s.count, 0) / stats.length)
        : 0;

      res.json({ stats, total, todayCount, avgDaily });
    } catch (error) {
      console.error("Get visit stats error:", error);
      res.status(500).json({ message: "Errore" });
    }
  });

  // ============ LOCATION LINKS ============

  // Get location by token (public endpoint)
  app.get("/api/location/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token || token.length < 32) {
        return res.status(400).json({ message: "Token non valido" });
      }

      const link = await storage.getLocationLinkByToken(token);
      
      if (!link) {
        return res.status(404).json({ message: "Posizione non trovata" });
      }

      // Check if expired
      if (new Date() > link.expiresAt) {
        return res.status(410).json({ message: "Questo link è scaduto" });
      }

      res.json({
        latitude: link.latitude,
        longitude: link.longitude,
        dogName: link.dogName,
        expiresAt: link.expiresAt,
      });
    } catch (error) {
      console.error("Get location error:", error);
      res.status(500).json({ message: "Errore nel recupero della posizione" });
    }
  });

  // ============ DATABASE MANAGEMENT (ADMIN) ============

  // OTP store for DB download
  const dbDownloadOtps = new Map<string, { code: string; expiresAt: number }>();

  // Request OTP for DB download
  app.post("/api/admin/download-db/request-code", async (req, res) => {
    try {
      const { adminPassword: pw } = req.body;

      if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      const code = crypto.randomInt(100000, 999999).toString();
      const ip = getClientIp(req);
      const ipHash = hashIp(ip);
      dbDownloadOtps.set(ipHash, { code, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

      const adminEmail = process.env.CONTACT_EMAIL || process.env.MERCHANT_EMAIL;
      if (!adminEmail) {
        return res.status(500).json({ message: "Email admin non configurata" });
      }

      // Send OTP via email
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@fidolink.it",
        to: adminEmail,
        subject: "FidoLink - Codice download database",
        html: `<h2>Codice di verifica</h2><p>Il tuo codice per scaricare il database è:</p><h1 style="font-size:36px;letter-spacing:8px;color:#6366f1">${code}</h1><p>Scade tra 10 minuti.</p>`,
      });

      res.json({ success: true, message: "Codice inviato alla tua email" });
    } catch (error) {
      console.error("Request download code error:", error);
      res.status(500).json({ message: "Errore nell'invio del codice" });
    }
  });

  // Download database with OTP verification
  app.get("/api/admin/download-db", async (req, res) => {
    try {
      const password = req.query.password as string;
      const code = req.query.code as string;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      if (!code) {
        return res.status(400).json({ message: "Codice di verifica richiesto" });
      }

      const ip = getClientIp(req);
      const ipHash = hashIp(ip);
      const otp = dbDownloadOtps.get(ipHash);

      if (!otp || otp.code !== code || Date.now() > otp.expiresAt) {
        return res.status(401).json({ message: "Codice non valido o scaduto" });
      }

      dbDownloadOtps.delete(ipHash); // One-time use

      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ message: "Database non trovato" });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      res.setHeader("Content-Disposition", `attachment; filename="fidolink-backup-${timestamp}.db"`);
      res.setHeader("Content-Type", "application/octet-stream");

      const stream = fs.createReadStream(dbPath);
      stream.pipe(res);
    } catch (error) {
      console.error("Download DB error:", error);
      res.status(500).json({ message: "Errore durante il download" });
    }
  });

  // Reset database (delete all data)
  app.post("/api/admin/reset-db", async (req, res) => {
    try {
      const { adminPassword, confirmCode } = req.body;

      if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Password admin non valida" });
      }

      if (confirmCode !== "RESET-FIDOLINK-DB") {
        return res.status(400).json({ message: "Codice di conferma non valido" });
      }

      // Delete all data from tables in correct order (foreign keys)
      await storage.resetAllData();

      res.json({ success: true, message: "Database azzerato con successo" });
    } catch (error) {
      console.error("Reset DB error:", error);
      res.status(500).json({ message: "Errore durante il reset" });
    }
  });

  return httpServer;
}
