/**
 * Seed iniziale: importa i dati dal vecchio database se il DB e' vuoto.
 * Viene eseguito automaticamente al primo avvio.
 */
import Database from "better-sqlite3";
import path from "path";

const toUnix = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  return Math.floor(new Date(iso).getTime() / 1000);
};
const bool = (v: boolean): number => (v ? 1 : 0);

const users = [
  { id: 3, email: "coldsun00@gmail.com", password_hash: "$2b$12$56x/XrHVUSR1eKd8gv781ua67Wsl.IqGsghNem6zRoDPN4JISFTe2", created_at: "2026-02-01T16:47:57.752Z", reset_token: null, reset_token_expiry: null },
  { id: 4, email: "kmarcosartorio97k@gmail.com", password_hash: "$2b$12$Fsoibrpja132wrOM2Bk2fuWblEZytZNuS2e.YBVQR6R6bH89n5Y4y", created_at: "2026-02-04T10:10:06.952Z", reset_token: null, reset_token_expiry: null },
];

const tags = [
  { id: 11, public_id: "ABXGGSS3", claim_code_hash: "$2b$10$OHOlWti.dAkQ169LVGF4yeVnayZWNcS56rn9LpLd7F6zHfVNzbbBS", owner_id: 4,    created_at: "2026-01-29T15:29:57.441Z", claimed_at: "2026-02-04T10:17:49.250Z", expires_at: "2028-02-04T10:17:49.250Z" },
  { id: 12, public_id: "SV95RMBS", claim_code_hash: "$2b$10$3ViSit.K3P6Ist/h.GjdQufo4qugQzSIpEZIeyynU7ID2P7ySywdy", owner_id: null, created_at: "2026-01-29T15:29:57.573Z", claimed_at: null, expires_at: null },
  { id: 13, public_id: "KWDRXUPP", claim_code_hash: "$2b$10$qFnKdGP2YgWDdjmWEfcvmOLtKMV.LxIHn3t2XMCgFx/hVFMcAaWqa", owner_id: null, created_at: "2026-01-29T15:29:57.702Z", claimed_at: null, expires_at: null },
  { id: 14, public_id: "STYFKPVK", claim_code_hash: "$2b$10$6DDOReEF6Qui3ctWCeDaBefugAJ5I0OejQG.u2N0AaMmveSRzAOda", owner_id: null, created_at: "2026-01-29T15:29:57.826Z", claimed_at: null, expires_at: null },
  { id: 15, public_id: "7EY62RFM", claim_code_hash: "$2b$10$oz2Ag1mn5bBmJahhMQQhuO1hasjZPaxJxWNDY9GZ86z/2VPenG09i", owner_id: 4,    created_at: "2026-01-29T15:29:57.948Z", claimed_at: "2026-02-04T10:16:14.581Z", expires_at: "2028-02-04T10:16:14.581Z" },
  { id: 16, public_id: "GU97KMHK", claim_code_hash: "$2b$10$n1UnBNB9J1Zi.n.xjwPV3efkLDOIvjXMKdaVQ3g0CYUYtg80KFVOG", owner_id: null, created_at: "2026-01-29T15:29:58.098Z", claimed_at: null, expires_at: null },
  { id: 17, public_id: "GAZ6WDCN", claim_code_hash: "$2b$10$dAhvlu2Tj2Q58gcfKGqv2.CQ4QYzyKg2cwqpJ3v0o.qfW0TmbMytW", owner_id: 4,    created_at: "2026-01-29T15:29:58.215Z", claimed_at: "2026-02-04T10:10:50.858Z", expires_at: "2028-02-04T10:10:50.858Z" },
  { id: 18, public_id: "SX6JCEP3", claim_code_hash: "$2b$10$hIjJ8JFAXOCzwrr6uqR6NuhRXc06Sl/exgBIA9.JFw/RajnfqWBUq", owner_id: null, created_at: "2026-01-29T15:29:58.331Z", claimed_at: null, expires_at: null },
  { id: 19, public_id: "6DZ2WK86", claim_code_hash: "$2b$10$zIyy46MGFv/bNb94tfB4vejCEM5I/VXrziOXgWkdukuXRGDjw5om.", owner_id: 4,    created_at: "2026-01-29T15:29:58.464Z", claimed_at: "2026-02-04T10:14:32.804Z", expires_at: "2028-02-04T10:14:32.804Z" },
  { id: 20, public_id: "TFUW7D8A", claim_code_hash: "$2b$10$W5FApMTXu4l4btbOTOHdyOK8OF8J7T1AlRGX4xmzLOqTHhaA8MCRK", owner_id: 3,    created_at: "2026-01-29T15:29:58.588Z", claimed_at: "2026-02-01T16:48:18.040Z", expires_at: "2028-02-01T16:48:18.040Z" },
];

const dogProfiles = [
  { id: 3, tag_id: 20, name: "Teodoro", photo_url: "https://scontent-mxp1-1.xx.fbcdn.net/v/t39.30808-6/481235089_666252302505850_2721224603349250769_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=BhdzXQG_vQgQ7kNvwHiSYTU&_nc_oc=Adlarx6DM22ulEjRwwMt7jaFCsIhWOE-61KJLeVClu3LWCLp7IbmrIK1zninJFQmKaTAim4rNRyIOGdUaf2LFluL&_nc_zt=23&_nc_ht=scontent-mxp1-1.xx&_nc_gid=EXGid1vVJffjrBimQdCiAQ&oh=00_AfsX4O8C__qdiF4pIJqN6gpE0FCu8CUhjvpkJcRGLE5Uag&oe=69869FBF", breed: "Labrador", sex: "maschio", size: "grande", birthdate: "2020-09-16", medical_notes: "Allergico al Pollo", instructions_text: "e' un cane socievole con persone e altri cani - Chiamare al numero indicato oppure al 3780842020 - intestato ad Andrea D'olivo", contact_phone: "3930101100", contact_whatsapp: "3930101100", contact_email: "coldsun00@gmail.com", show_phone: true, show_whatsapp: true, show_email: true, notify_on_scan: true, city: "Alice Bel Colle", updated_at: "2026-02-02T15:52:54.670Z" },
  { id: 4, tag_id: 17, name: "Kenya",   photo_url: "", breed: "Australian Shepherd l", sex: "femmina", size: "media", birthdate: "2023-01-11", medical_notes: "", instructions_text: "", contact_phone: "3462877408", contact_whatsapp: "3462877408", contact_email: "kmarcosartorio97k@gmail.com", show_phone: true, show_whatsapp: true, show_email: false, notify_on_scan: true, city: "Cuvio", updated_at: "2026-02-04T10:13:03.765Z" },
  { id: 5, tag_id: 19, name: "Neige",   photo_url: "", breed: "Australian Shepherd",   sex: "maschio", size: "media", birthdate: "2020-10-26", medical_notes: "", instructions_text: "", contact_phone: "3462877408", contact_whatsapp: "3462877408", contact_email: "kmarcosartorio97k@gmail.com", show_phone: true, show_whatsapp: true, show_email: false, notify_on_scan: true, city: "Cuvio", updated_at: "2026-02-04T10:15:31.088Z" },
  { id: 6, tag_id: 15, name: "Mirta",   photo_url: "", breed: "Australian Shepherd",   sex: "femmina", size: "media", birthdate: "2023-11-12", medical_notes: "", instructions_text: "", contact_phone: "3462877408", contact_whatsapp: "3462877408", contact_email: "kmarcosartorio97k@gmail.com", show_phone: true, show_whatsapp: true, show_email: false, notify_on_scan: true, city: "Cuvio", updated_at: "2026-02-04T10:17:08.571Z" },
  { id: 7, tag_id: 11, name: "Ambra",   photo_url: "", breed: "Australian Shepherd",   sex: "femmina", size: "media", birthdate: "2025-03-15", medical_notes: "", instructions_text: "", contact_phone: "3462877408", contact_whatsapp: "3462877408", contact_email: "kmarcosartorio97k@gmail.com", show_phone: true, show_whatsapp: true, show_email: false, notify_on_scan: true, city: "Cuvio", updated_at: "2026-02-04T10:18:41.571Z" },
];

const scanEvents = [
  { id: 42, tag_id: 20, created_at: "2026-02-09T17:04:29.312Z", ip_hash: "43e7ca6a02ec2618894c68655581d8328f8b8f35eab6c32fcbd2d319ee1e0aae", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1", latitude: 44.726543543082414, longitude: 8.446009733245575 },
];

const pageVisits = [
  { id: 1,   date: "2026-02-03", count: 6 },  { id: 7,   date: "2026-02-04", count: 7 },
  { id: 14,  date: "2026-02-05", count: 9 },  { id: 23,  date: "2026-02-06", count: 2 },
  { id: 25,  date: "2026-02-07", count: 9 },  { id: 34,  date: "2026-02-08", count: 4 },
  { id: 38,  date: "2026-02-09", count: 6 },  { id: 44,  date: "2026-02-10", count: 3 },
  { id: 47,  date: "2026-02-11", count: 3 },  { id: 50,  date: "2026-02-12", count: 4 },
  { id: 54,  date: "2026-02-13", count: 2 },  { id: 56,  date: "2026-02-14", count: 5 },
  { id: 61,  date: "2026-02-15", count: 2 },  { id: 63,  date: "2026-02-16", count: 4 },
  { id: 67,  date: "2026-02-17", count: 2 },  { id: 69,  date: "2026-02-18", count: 6 },
  { id: 75,  date: "2026-02-19", count: 2 },  { id: 77,  date: "2026-02-20", count: 5 },
  { id: 82,  date: "2026-02-22", count: 2 },  { id: 84,  date: "2026-02-24", count: 2 },
  { id: 86,  date: "2026-02-25", count: 4 },  { id: 90,  date: "2026-02-26", count: 2 },
  { id: 92,  date: "2026-02-27", count: 2 },  { id: 94,  date: "2026-02-28", count: 2 },
  { id: 96,  date: "2026-03-02", count: 1 },  { id: 97,  date: "2026-03-04", count: 2 },
  { id: 99,  date: "2026-03-05", count: 1 },  { id: 100, date: "2026-03-06", count: 1 },
  { id: 101, date: "2026-03-07", count: 2 },  { id: 103, date: "2026-03-08", count: 2 },
  { id: 106, date: "2026-03-10", count: 2 },
];

const locationLinks = [
  { id: 1, token: "24a25e5bfc2cf2a7616622af84058f5f485e69b781525e7a34bdd8a4d9395309", latitude: 44.726543543082414, longitude: 8.446009733245575, dog_name: "Teodoro", created_at: "2026-02-03T14:23:17.973Z", expires_at: "2026-03-05T14:23:17.956Z" },
  { id: 2, token: "ca9bd3eea410043b18330a343b9b520f52001efa20369566558f5ef285f29076", latitude: 44.726543543082414, longitude: 8.446009733245575, dog_name: "Teodoro", created_at: "2026-02-04T07:55:54.724Z", expires_at: "2026-03-06T07:55:54.707Z" },
  { id: 3, token: "987b8919454fa2deb42bcd7a52a2d53018490aa4432766c409a494fe0503e881", latitude: 44.726543543082414, longitude: 8.446009733245575, dog_name: "Teodoro", created_at: "2026-02-09T17:04:29.457Z", expires_at: "2026-03-11T17:04:29.440Z" },
];

export function seedIfEmpty() {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "database.db");
  const sqlite = new Database(dbPath);

  try {
    const count = (sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
    if (count > 0) return; // gia' popolato

    console.log("[seed] Database vuoto, importo dati iniziali...");

    sqlite.pragma("foreign_keys = OFF");

    const run = sqlite.transaction(() => {
      const insUser = sqlite.prepare(`INSERT OR REPLACE INTO users (id, email, password_hash, reset_token, reset_token_expiry, created_at) VALUES (@id, @email, @passwordHash, @resetToken, @resetTokenExpiry, @createdAt)`);
      for (const u of users) insUser.run({ id: u.id, email: u.email, passwordHash: u.password_hash, resetToken: u.reset_token, resetTokenExpiry: toUnix(u.reset_token_expiry), createdAt: toUnix(u.created_at) });

      const insTag = sqlite.prepare(`INSERT OR REPLACE INTO tags (id, public_id, claim_code_hash, owner_id, created_at, claimed_at, expires_at) VALUES (@id, @publicId, @claimCodeHash, @ownerId, @createdAt, @claimedAt, @expiresAt)`);
      for (const t of tags) insTag.run({ id: t.id, publicId: t.public_id, claimCodeHash: t.claim_code_hash, ownerId: t.owner_id, createdAt: toUnix(t.created_at), claimedAt: toUnix(t.claimed_at), expiresAt: toUnix(t.expires_at) });

      const insProfile = sqlite.prepare(`INSERT OR REPLACE INTO dog_profiles (id, tag_id, name, photo_url, breed, sex, size, birthdate, medical_notes, instructions_text, contact_phone, contact_whatsapp, contact_email, show_phone, show_whatsapp, show_email, notify_on_scan, city, updated_at) VALUES (@id, @tagId, @name, @photoUrl, @breed, @sex, @size, @birthdate, @medicalNotes, @instructionsText, @contactPhone, @contactWhatsapp, @contactEmail, @showPhone, @showWhatsapp, @showEmail, @notifyOnScan, @city, @updatedAt)`);
      for (const p of dogProfiles) insProfile.run({ id: p.id, tagId: p.tag_id, name: p.name, photoUrl: p.photo_url || null, breed: p.breed || null, sex: p.sex || null, size: p.size || null, birthdate: p.birthdate || null, medicalNotes: p.medical_notes || null, instructionsText: p.instructions_text || null, contactPhone: p.contact_phone || null, contactWhatsapp: p.contact_whatsapp || null, contactEmail: p.contact_email || null, showPhone: bool(p.show_phone), showWhatsapp: bool(p.show_whatsapp), showEmail: bool(p.show_email), notifyOnScan: bool(p.notify_on_scan), city: p.city || null, updatedAt: toUnix(p.updated_at) });

      const insScan = sqlite.prepare(`INSERT OR REPLACE INTO scan_events (id, tag_id, created_at, ip_hash, user_agent, latitude, longitude) VALUES (@id, @tagId, @createdAt, @ipHash, @userAgent, @latitude, @longitude)`);
      for (const s of scanEvents) insScan.run({ id: s.id, tagId: s.tag_id, createdAt: toUnix(s.created_at), ipHash: s.ip_hash, userAgent: s.user_agent, latitude: s.latitude, longitude: s.longitude });

      const insVisit = sqlite.prepare(`INSERT OR REPLACE INTO page_visits (id, date, count) VALUES (@id, @date, @count)`);
      for (const v of pageVisits) insVisit.run(v);

      const insLink = sqlite.prepare(`INSERT OR REPLACE INTO location_links (id, token, latitude, longitude, dog_name, created_at, expires_at) VALUES (@id, @token, @latitude, @longitude, @dogName, @createdAt, @expiresAt)`);
      for (const l of locationLinks) insLink.run({ id: l.id, token: l.token, latitude: l.latitude, longitude: l.longitude, dogName: l.dog_name, createdAt: toUnix(l.created_at), expiresAt: toUnix(l.expires_at) });
    });

    run();
    sqlite.pragma("foreign_keys = ON");
    console.log(`[seed] ✅ Importati: ${users.length} utenti, ${tags.length} tag, ${dogProfiles.length} cani`);
  } finally {
    sqlite.close();
  }
}
