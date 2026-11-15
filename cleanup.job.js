import Record from '../models/Record.js';

export async function cleanupStaleRecords() {
  const retentionDays = Number(process.env.RETENTION_DAYS || 90);

  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error('Invalid RETENTION_DAYS configuration');
  }

  const cutoffDate = new Date(
    Date.now() - retentionDays * 86400000
  );

  const result = await Record.deleteMany({
    createdAt: {
      $lt: cutoffDate
    }
  });

  return {
    message: 'Cleanup completed',
    deletedCount: result.deletedCount,
    cutoffDate
  };
}