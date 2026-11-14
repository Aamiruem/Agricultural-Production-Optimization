import mongoose from "mongoose";

export const SEASONS = ["kharif", "rabi", "zaid", "perennial"];
export const FIELD_STATUSES = ["planned", "sown", "growing", "harvested"];

const photoSchema = new mongoose.Schema(
  { key: { type: String, required: true }, url: String, uploadedAt: { type: Date, default: Date.now } },
  { _id: false },
);

const fieldSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    farmId: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    crop: { type: String, required: true, lowercase: true, trim: true },
    season: { type: String, enum: SEASONS, required: true },
    areaHa: { type: Number, required: true, min: 0.01, max: 10000 },
    status: { type: String, enum: FIELD_STATUSES, default: "planned" },
    soil: {
      N: { type: Number, min: 0, max: 200 },
      P: { type: Number, min: 0, max: 200 },
      K: { type: Number, min: 0, max: 250 },
      ph: { type: Number, min: 0, max: 14 },
    },
    photos: { type: [photoSchema], default: [] },
  },
  { timestamps: true },
);

fieldSchema.index({ farmId: 1, createdAt: -1 });
fieldSchema.index({ ownerId: 1, status: 1 });

export const Field = mongoose.model("Field", fieldSchema);
