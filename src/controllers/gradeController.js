import { getAll, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";
import Grade from "../models/Grade.js";

const normalizeFeatures = (body) => {
  if (typeof body.features === "string") {
    body.features = body.features.split("\n").map((item) => item.trim()).filter(Boolean);
  }
  if (body.translations?.fr?.features && typeof body.translations.fr.features === "string") {
    body.translations.fr.features = body.translations.fr.features.split("\n").map((item) => item.trim()).filter(Boolean);
  }
  return body;
};

export const getGrades = getAll(Grade, { paginate: false, baseFilter: (req) => (req.query.active !== "false" ? { isActive: true } : {}) });
export const createGrade = (req, res, next) => { req.body = normalizeFeatures(req.body); return createOne(Grade)(req, res, next); };
export const updateGrade = (req, res, next) => { req.body = normalizeFeatures(req.body); return updateOne(Grade)(req, res, next); };
export const deleteGrade = deleteOne(Grade);
