import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true }, // `sub` claim of the JWT
    name: { type: String, required: true, trim: true, maxlength: 80 },
    location: {
      state: { type: String, trim: true, maxlength: 60 },
      district: { type: String, trim: true, maxlength: 60 },
      // GeoJSON point enables geospatial queries ($near) later on.
      point: {
        type: { type: String, enum: ["Point"] },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },
  },
  { timestamps: true },
);

farmSchema.index({ ownerId: 1, name: 1 }, { unique: true }); // one farm name per owner
farmSchema.index({ "location.point": "2dsphere" }, { sparse: true });

export const Farm = mongoose.model("Farm", farmSchema);
