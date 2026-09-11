import RepairPrice from "../models/RepairPrice.js";

// A category/service price is the default. Brand, model, and variant prices
// are optional overrides, selected only when they match the chosen device.
export const findBestRepairPrice = async ({ category, brand, model, variant, service }) => {
  const candidates = await RepairPrice.find({
    deviceCategory: category,
    repairService: service,
    isActive: true,
  });

  const matches = (value, requested) => !value || (requested && value.toString() === requested.toString());
  const eligible = candidates.filter((price) => (
    matches(price.brand, brand)
    && matches(price.deviceModel, model)
    && matches(price.deviceVariant, variant)
  ));

  return eligible.sort((a, b) => {
    const specificity = (price) => Number(!!price.brand) + Number(!!price.deviceModel) + Number(!!price.deviceVariant);
    return specificity(b) - specificity(a);
  })[0] || null;
};
