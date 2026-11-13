import mongoose from "mongoose";

import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

export async function connectDb(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  logger.info({ db: mongoose.connection.name }, "MongoDB connected");
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
