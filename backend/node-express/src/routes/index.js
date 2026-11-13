import { Router } from "express";

import * as farms from "../controllers/farm.controller.js";
import * as fields from "../controllers/field.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as s from "../validators/schemas.js";

export const router = Router();

router.use(requireAuth);

// Farms
router.get("/farms", farms.listFarms);
router.post("/farms", validate({ body: s.createFarm }), farms.createFarm);
router.get("/farms/:id", validate({ params: s.idParams }), farms.getFarm);
router.patch("/farms/:id", validate({ params: s.idParams, body: s.updateFarm }), farms.updateFarm);
router.delete("/farms/:id", validate({ params: s.idParams }), farms.deleteFarm);
router.get("/farms/:id/summary", validate({ params: s.idParams }), farms.farmSummary);

// Fields (nested under a farm for listing/creating)
router.get("/farms/:id/fields", validate({ params: s.idParams }), fields.listFields);
router.post("/farms/:id/fields", validate({ params: s.idParams, body: s.createField }), fields.createField);
router.patch("/fields/:id", validate({ params: s.idParams, body: s.updateField }), fields.updateField);
router.delete("/fields/:id", validate({ params: s.idParams }), fields.deleteField);

// Activities
router.get("/fields/:id/activities", validate({ params: s.idParams, query: s.listQuery }), fields.listActivities);
router.post("/fields/:id/activities", validate({ params: s.idParams, body: s.createActivity }), fields.createActivity);

// Integrations: Python ML service + AWS S3
router.post("/fields/:id/fertilizer-plan", validate({ params: s.idParams }), fields.fieldFertilizerPlan);
router.post("/fields/:id/photos/presign", validate({ params: s.idParams, body: s.presignPhoto }), fields.presignPhoto);
router.post("/fields/:id/photos", validate({ params: s.idParams, body: s.recordPhoto }), fields.recordPhoto);
