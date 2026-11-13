import mongoose from "mongoose";

/**
 * Run `fn(session)` in a MongoDB transaction. Transactions need a replica set
 * (MongoDB Atlas, the docker-compose `mongo` service); on a standalone server
 * the work runs without one (`session` is null) so local development still works.
 */
export async function withTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    // Standalone servers reject transactions before any write is applied.
    const standalone =
      err?.code === 20 || /replica set|Transaction numbers|does not support retryable writes/i.test(err?.message ?? "");
    if (!standalone) throw err;
    return fn(null);
  } finally {
    await session.endSession();
  }
}
