import { Activity } from "../models/activity.model.js";
import { Field } from "../models/field.model.js";
import { fertilizerPlan } from "../services/agri-api.client.js";
import { emitToUser } from "../services/realtime.js";
import { createPhotoUpload, photoKeyPrefix, publicUrl } from "../services/storage.service.js";
import { HttpError } from "../utils/http-error.js";
import { findOwnedFarm } from "./farm.controller.js";

async function findOwnedField(id, ownerId) {
  const field = await Field.findOne({ _id: id, ownerId });
  if (!field) throw new HttpError(404, "Field not found");
  return field;
}

export async function listFields(req, res) {
  const farm = await findOwnedFarm(req.valid.params.id, req.user.id);
  res.json(await Field.find({ farmId: farm._id }).sort({ createdAt: -1 }).lean());
}

export async function createField(req, res) {
  const farm = await findOwnedFarm(req.valid.params.id, req.user.id);
  const field = await Field.create({ ...req.valid.body, farmId: farm._id, ownerId: req.user.id });
  emitToUser(req.user.id, "field:created", field);
  res.status(201).json(field);
}

export async function updateField(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  field.set(req.valid.body);
  await field.save();
  emitToUser(req.user.id, "field:updated", field);
  res.json(field);
}

export async function deleteField(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  await Activity.deleteMany({ fieldId: field._id });
  await field.deleteOne();
  emitToUser(req.user.id, "field:deleted", { id: String(field._id), farmId: String(field.farmId) });
  res.status(204).end();
}

export async function listActivities(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  const { limit } = req.valid.query;
  res.json(await Activity.find({ fieldId: field._id }).sort({ date: -1 }).limit(limit).lean());
}

export async function createActivity(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  const activity = await Activity.create({
    ...req.valid.body,
    fieldId: field._id,
    farmId: field.farmId,
    ownerId: req.user.id,
  });
  // Recording sowing/harvest also moves the field's status forward.
  const nextStatus = { sowing: "sown", harvest: "harvested" }[activity.type];
  if (nextStatus && field.status !== nextStatus) {
    field.status = nextStatus;
    await field.save();
    emitToUser(req.user.id, "field:updated", field);
  }
  emitToUser(req.user.id, "activity:created", { ...activity.toObject(), fieldName: field.name });
  res.status(201).json(activity);
}

export async function fieldFertilizerPlan(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  const { N, P, K } = field.soil ?? {};
  if ([N, P, K].some((v) => v === undefined || v === null)) {
    throw new HttpError(422, "Add the field's soil N, P and K first");
  }
  res.json(
    await fertilizerPlan(
      { crop: field.crop, N, P, K, areaHa: field.areaHa },
      { authorization: req.headers.authorization },
    ),
  );
}

export async function presignPhoto(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  res.json(await createPhotoUpload(String(field._id), req.valid.body));
}

export async function recordPhoto(req, res) {
  const field = await findOwnedField(req.valid.params.id, req.user.id);
  const { key } = req.valid.body;
  if (!key.startsWith(photoKeyPrefix(String(field._id)))) throw new HttpError(422, "Key does not belong to this field");
  field.photos.push({ key, url: publicUrl(key) });
  await field.save();
  emitToUser(req.user.id, "field:updated", field);
  res.status(201).json(field);
}
