import crypto from "crypto";
import bcrypt from "bcrypt";

// Generate a secure publicId (6-8 alphanumeric characters)
export function generatePublicId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars: 0/O, 1/I/l
  let result = "";
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

// Generate a claimCode in format DS-XXXX-XXXX
export function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  const randomBytes = crypto.randomBytes(8);
  
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomBytes[i] % chars.length];
    part2 += chars[randomBytes[i + 4] % chars.length];
  }
  
  return `DS-${part1}-${part2}`;
}

// Hash claimCode with bcrypt
export async function hashClaimCode(claimCode: string): Promise<string> {
  return bcrypt.hash(claimCode, 10);
}

// Verify claimCode against hash
export async function verifyClaimCode(claimCode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(claimCode, hash);
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash IP address for privacy
export function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET || "ip-salt";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

// Extract IP from request
export function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}

// Generate JWT token
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required for security. Please set it in your secrets.");
  }
  return secret;
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: number };
  } catch {
    return null;
  }
}
