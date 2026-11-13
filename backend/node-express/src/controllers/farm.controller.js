import mongoose from "mongoose";

import { Activity } from "../models/activity.model.js";
import { Farm } from "../models/farm.model.js";
import { Field } from "../models/field.model.js";
import { emitToUser } from "../services/realtime.js";
import { withTransaction } from "../utils/transaction.js";
import { HttpError } from "../utils/http-error.js";

function toFarmDoc({ name, location }) {
  const doc = { name };
  if (location) {
    const { state, district, lat, lng } = location;
    doc.location = { state, district };
    if (lat !== undefined && lng !== undefined) doc.location.point = { type: "Point", coordinates: [lng, lat] };
  }
  return doc;
}

export async function findOwnedFarm(id, ownerId) {
  const farm = await Farm.findOne({ _id: id, ownerId });
  if (!farm) throw new HttpError(404, "Farm not found");
  return farm;
}

export async function listFarms(req, res) {
  const ownerId = req.user.id;
  // $lookup-free counts: one grouped query instead of N per-farm queries.
  const [farms, counts] = await Promise.all([
    Farm.find({ ownerId }).sort({ createdAt: -1 }).lean(),
    Field.aggregate([
      { $match: { ownerId } },
      { $group: { _id: "$farmId", fields: { $sum: 1 }, areaHa: { $sum: "$areaHa" } } },
    ]),
  ]);
  const byFarm = new Map(counts.map((c) => [String(c._id), c]));
  res.json(farms.map((f) => ({ ...f, fields: byFarm.get(String(f._id))?.fields ?? 0, areaHa: byFarm.get(String(f._id))?.areaHa ?? 0 })));
}

export async function createFarm(req, res) {
  const farm = await Farm.create({ ...toFarmDoc(req.valid.body), ownerId: req.user.id });
  emitToUser(req.user.id, "farm:created", farm);
  res.status(201).json(farm);
}

export async function getFarm(req, res) {
  res.json(await findOwnedFarm(req.valid.params.id, req.user.id));
}

export async function updateFarm(req, res) {
  const farm = await findOwnedFarm(req.valid.params.id, req.user.id);
  const body = req.valid.body;
  if (body.name !== undefined) farm.name = body.name;
  if (body.location !== undefined) farm.location = toFarmDoc({ name: farm.name, location: body.location }).location;
  await farm.save();
  res.json(farm);
}

export async function deleteFarm(req, res) {
  const farm = await findOwnedFarm(req.valid.params.id, req.user.id);
  // Farm, its fields and their activities are removed together (atomically on a replica set).
  await withTransaction(async (session) => {
    await Activity.deleteMany({ farmId: farm._id }, { session });
    await Field.deleteMany({ farmId: farm._id }, { session });
    await Farm.deleteOne({ _id: farm._id }, { session });
  });
  emitToUser(req.user.id, "farm:deleted", { id: String(farm._id) });
  res.status(204).end();
}

export async function farmSummary(req, res) {
  const farm = await findOwnedFarm(req.valid.params.id, req.user.id);
  const farmId = new mongoose.Types.ObjectId(farm._id);

  const [[stats], recent] = await Promise.all([
    Field.aggregate([
      { $match: { farmId } },
      {
        $facet: {
          totals: [{ $group: { _id: null, fields: { $sum: 1 }, areaHa: { $sum: "$areaHa" } } }],
          byCrop: [
            { $group: { _id: "$crop", fields: { $sum: 1 }, areaHa: { $sum: "$areaHa" } } },
            { $sort: { areaHa: -1 } },
          ],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        },
      },
    ]),
    // Join each recent activity with its field's name ($lookup = SQL JOIN).
    Activity.aggregate([
      { $match: { farmId } },
      { $sort: { date: -1 } },
      { $limit: 10 },
      { $lookup: { from: "fields", localField: "fieldId", foreignField: "_id", as: "field" } },
      { $unwind: "$field" },
      { $project: { type: 1, notes: 1, quantity: 1, unit: 1, date: 1, fieldId: 1, fieldName: "$field.name" } },
    ]),
  ]);

  res.json({
    farm,
    totals: stats.totals[0] ? { fields: stats.totals[0].fields, areaHa: stats.totals[0].areaHa } : { fields: 0, areaHa: 0 },
    byCrop: stats.byCrop.map((c) => ({ crop: c._id, fields: c.fields, areaHa: c.areaHa })),
    byStatus: Object.fromEntries(stats.byStatus.map((s) => [s._id, s.count])),
    recentActivities: recent,
  });
}
