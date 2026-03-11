import { storage } from "./storage";

const SCAN_DATA_RETENTION_DAYS = 30;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every hour

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [cleanup] ${message}`);
}

export function startCleanupJob() {
  async function runCleanup() {
    try {
      const deletedCount = await storage.deleteOldScanEvents(SCAN_DATA_RETENTION_DAYS);
      if (deletedCount > 0) {
        log(`Deleted ${deletedCount} scan events older than ${SCAN_DATA_RETENTION_DAYS} days`);
      }
    } catch (error) {
      console.error("Cleanup job error:", error);
    }
  }

  runCleanup();

  setInterval(runCleanup, CLEANUP_INTERVAL_MS);

  log(`Started (runs every hour, deletes scan data older than ${SCAN_DATA_RETENTION_DAYS} days)`);
}
