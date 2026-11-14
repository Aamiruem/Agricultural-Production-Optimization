import mongoose from "mongoose";

export const ACTIVITY_TYPES = ["sowing", "irrigation", "fertilizer", "pesticide", "harvest", "note"];

const activitySchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    farmId: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: "Field", required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    notes: { type: String, maxlength: 500, default: "" },
    quantity: { type: Number, min: 0 },
    unit: { type: String, maxlength: 20 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

activitySchema.index({ fieldId: 1, date: -1 });
activitySchema.index({ ownerId: 1, date: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
