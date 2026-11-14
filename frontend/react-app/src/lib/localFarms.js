// On-device farm store with the same shapes as the Express farm-service, used when
// the user is signed out or the service/database is unavailable (e.g. static hosting).
import { fertilizerLocal } from "./agriModels";

const KEY = "agri-local-farms-v1";
const empty = () => ({ farms: [], fields: [], activities: [] });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const db = raw ? JSON.parse(raw) : empty();
    return { ...empty(), ...db };
  } catch {
    return empty();
  }
}
function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    throw new Error("Could not save on this device (storage is full or blocked).");
  }
}
const id = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`)
    .replace(/-/g, "")
    .slice(0, 24);
const now = () => new Date().toISOString();
const fail = (status, detail) => Object.assign(new Error(detail), { status, response: { status, data: { detail } } });

function farmOrThrow(db, farmId) {
  const farm = db.farms.find((f) => f._id === farmId);
  if (!farm) throw fail(404, "Farm not found");
  return farm;
}

export const localFarms = {
  listFarms() {
    const db = load();
    return db.farms
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((f) => {
        const fields = db.fields.filter((x) => x.farmId === f._id);
        return { ...f, fields: fields.length, areaHa: fields.reduce((s, x) => s + x.areaHa, 0) };
      });
  },

  createFarm({ name, location = {} }) {
    const db = load();
    const clean = name.trim();
    if (db.farms.some((f) => f.name.toLowerCase() === clean.toLowerCase()))
      throw fail(409, "You already have a farm with this name");
    const { state, district, village, lat, lng } = location;
    const farm = {
      _id: id(),
      name: clean,
      createdAt: now(),
      updatedAt: now(),
      location: {
        state,
        district,
        village,
        ...(lat !== undefined && lng !== undefined ? { point: { type: "Point", coordinates: [lng, lat] } } : {}),
      },
    };
    db.farms.push(farm);
    save(db);
    return farm;
  },

  deleteFarm(farmId) {
    const db = load();
    farmOrThrow(db, farmId);
    save({
      farms: db.farms.filter((f) => f._id !== farmId),
      fields: db.fields.filter((f) => f.farmId !== farmId),
      activities: db.activities.filter((a) => a.farmId !== farmId),
    });
  },

  summary(farmId) {
    const db = load();
    const farm = farmOrThrow(db, farmId);
    const fields = db.fields.filter((f) => f.farmId === farmId);
    const byCrop = Object.values(
      fields.reduce((acc, f) => {
        acc[f.crop] ??= { crop: f.crop, fields: 0, areaHa: 0 };
        acc[f.crop].fields += 1;
        acc[f.crop].areaHa += f.areaHa;
        return acc;
      }, {}),
    ).sort((a, b) => b.areaHa - a.areaHa);
    const byStatus = fields.reduce((acc, f) => ({ ...acc, [f.status]: (acc[f.status] ?? 0) + 1 }), {});
    const recentActivities = db.activities
      .filter((a) => a.farmId === farmId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map((a) => ({ ...a, fieldName: db.fields.find((f) => f._id === a.fieldId)?.name ?? "Field" }));
    return {
      farm,
      totals: { fields: fields.length, areaHa: fields.reduce((s, f) => s + f.areaHa, 0) },
      byCrop,
      byStatus,
      recentActivities,
    };
  },

  listFields(farmId) {
    const db = load();
    farmOrThrow(db, farmId);
    return db.fields.filter((f) => f.farmId === farmId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createField(farmId, field) {
    const db = load();
    farmOrThrow(db, farmId);
    const created = {
      _id: id(),
      farmId,
      status: "planned",
      photos: [],
      createdAt: now(),
      ...field,
      crop: field.crop.toLowerCase(),
    };
    db.fields.push(created);
    save(db);
    return created;
  },

  deleteField(fieldId) {
    const db = load();
    save({
      ...db,
      fields: db.fields.filter((f) => f._id !== fieldId),
      activities: db.activities.filter((a) => a.fieldId !== fieldId),
    });
  },

  logActivity(fieldId, activity) {
    const db = load();
    const field = db.fields.find((f) => f._id === fieldId);
    if (!field) throw fail(404, "Field not found");
    const created = { _id: id(), fieldId, farmId: field.farmId, date: now(), ...activity };
    db.activities.push(created);
    // Same rule as the server: sowing/harvest move the field's status forward.
    const next = { sowing: "sown", harvest: "harvested" }[activity.type];
    if (next) field.status = next;
    save(db);
    return created;
  },

  fertilizerPlan(fieldId) {
    const field = load().fields.find((f) => f._id === fieldId);
    if (!field) throw fail(404, "Field not found");
    if (field.soil?.N === undefined) throw fail(422, "Add soil N-P-K values to this field to get a fertilizer plan.");
    return fertilizerLocal({
      crop: field.crop,
      N: field.soil.N,
      P: field.soil.P ?? 0,
      K: field.soil.K ?? 0,
      area_ha: field.areaHa,
    });
  },

  /** Stores a small thumbnail (data URL) on the device. */
  async addPhoto(fieldId, file) {
    const url = await thumbnail(file, 320);
    const db = load();
    const field = db.fields.find((f) => f._id === fieldId);
    if (!field) throw fail(404, "Field not found");
    field.photos = [...(field.photos ?? []), { key: id(), url }].slice(-6);
    save(db);
    return field;
  },

  clear() {
    save(empty());
  },
};

function thumbnail(file, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = URL.createObjectURL(file);
  });
}
