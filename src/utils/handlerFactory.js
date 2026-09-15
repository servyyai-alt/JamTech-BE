import catchAsync from "./catchAsync.js";
import AppError from "./AppError.js";
import APIFeatures from "./apiFeatures.js";
import { localizeDocs } from "./localize.js";

// Generic CRUD factory used for simple reference-data resources
// (device categories, brands, models, variants, repair services, product categories, coupons, etc.)

export const getAll = (Model, options = {}) =>
  catchAsync(async (req, res) => {
    const filter = options.baseFilter ? options.baseFilter(req) : {};
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .search(options.searchFields || [])
      .sort()
      .limitFields();

    let query = features.query;
    if (options.populate) query = query.populate(options.populate);

    // pagination only if not explicitly disabled
    if (options.paginate !== false) {
      const paginated = new APIFeatures(query, req.query).paginate();
      query = paginated.query;
    }

    const docs = await query;
    const total = await Model.countDocuments(filter);

    localizeDocs(docs, req.query.lang);

    res.status(200).json({ success: true, results: docs.length, total, data: docs });
  });

export const getOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (options.populate) query = query.populate(options.populate);
    const doc = await query;
    if (!doc) return next(new AppError("No document found with that ID", 404));
    localizeDocs(doc, req.query.lang);
    res.status(200).json({ success: true, data: doc });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ success: true, data: doc });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError("No document found with that ID", 404));
    res.status(200).json({ success: true, data: doc });
  });

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError("No document found with that ID", 404));
    res.status(204).json({ success: true, data: null });
  });
