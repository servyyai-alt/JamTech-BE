import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import slugify from "slugify";
import connectDB from "../config/db.js";
import DeviceCategory from "../models/DeviceCategory.js";
import Brand from "../models/Brand.js";
import DeviceModel from "../models/DeviceModel.js";
import DeviceVariant from "../models/DeviceVariant.js";
import RepairService from "../models/RepairService.js";
import RepairPrice from "../models/RepairPrice.js";

const slug = (value) => slugify(value, { lower: true, strict: true });

// This is deliberately a repair catalogue: each entry represents a distinct
// hardware generation and its commonly repaired storage/network configurations.
// Re-running this file is safe: it only inserts records that do not exist.
const phoneCatalog = {
  Apple: {
    2020: ["iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max"],
    2021: ["iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max"],
    2022: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone SE (3rd generation)"],
    2023: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"],
    2024: ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 16e"],
  },
  Samsung: {
    2020: ["Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra", "Galaxy S20 FE", "Galaxy Note20", "Galaxy Note20 Ultra", "Galaxy Z Flip", "Galaxy Z Fold2"],
    2021: ["Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra", "Galaxy S21 FE", "Galaxy Z Flip3", "Galaxy Z Fold3", "Galaxy A52", "Galaxy A72"],
    2022: ["Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra", "Galaxy Z Flip4", "Galaxy Z Fold4", "Galaxy A33", "Galaxy A53", "Galaxy A73"],
    2023: ["Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra", "Galaxy S23 FE", "Galaxy Z Flip5", "Galaxy Z Fold5", "Galaxy A14", "Galaxy A34", "Galaxy A54"],
    2024: ["Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra", "Galaxy S24 FE", "Galaxy Z Flip6", "Galaxy Z Fold6", "Galaxy A15", "Galaxy A25", "Galaxy A35", "Galaxy A55"],
    2025: ["Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra", "Galaxy S25 Edge", "Galaxy A16", "Galaxy A26", "Galaxy A36", "Galaxy A56"],
  },
  "Google Pixel": {
    2021: ["Pixel 6", "Pixel 6 Pro", "Pixel 6a"],
    2022: ["Pixel 7", "Pixel 7 Pro"],
    2023: ["Pixel 7a", "Pixel 8", "Pixel 8 Pro"],
    2024: ["Pixel 8a", "Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL", "Pixel 9 Pro Fold"],
    2025: ["Pixel 9a"],
  },
  OnePlus: {
    2020: ["OnePlus 8", "OnePlus 8 Pro", "OnePlus 8T", "OnePlus Nord"],
    2021: ["OnePlus 9", "OnePlus 9 Pro", "OnePlus 9R", "OnePlus Nord 2"],
    2022: ["OnePlus 10 Pro", "OnePlus 10R", "OnePlus Nord 2T", "OnePlus Nord CE 2"],
    2023: ["OnePlus 11", "OnePlus 11R", "OnePlus Nord 3", "OnePlus Nord CE 3"],
    2024: ["OnePlus 12", "OnePlus 12R", "OnePlus Nord 4", "OnePlus Nord CE 4"],
    2025: ["OnePlus 13", "OnePlus 13R", "OnePlus Nord 5", "OnePlus Nord CE 5"],
  },
  Xiaomi: {
    2021: ["Xiaomi 11 Lite 5G NE", "Xiaomi 11T", "Xiaomi 11T Pro", "Mi 11", "Mi 11 Ultra"],
    2022: ["Xiaomi 12", "Xiaomi 12 Pro", "Xiaomi 12 Lite", "Xiaomi 12T", "Xiaomi 12T Pro"],
    2023: ["Xiaomi 13", "Xiaomi 13 Pro", "Xiaomi 13 Lite", "Xiaomi 13T", "Xiaomi 13T Pro"],
    2024: ["Xiaomi 14", "Xiaomi 14 Ultra", "Xiaomi 14T", "Xiaomi 14T Pro"],
    2025: ["Xiaomi 15", "Xiaomi 15 Ultra"],
  },
  Redmi: {
    2021: ["Redmi Note 10", "Redmi Note 10 Pro", "Redmi Note 10S"],
    2022: ["Redmi Note 11", "Redmi Note 11 Pro", "Redmi Note 11 Pro+"],
    2023: ["Redmi Note 12", "Redmi Note 12 Pro", "Redmi Note 12 Pro+"],
    2024: ["Redmi Note 13", "Redmi Note 13 Pro", "Redmi Note 13 Pro+"],
    2025: ["Redmi Note 14", "Redmi Note 14 Pro", "Redmi Note 14 Pro+"],
  },
  POCO: {
    2021: ["POCO F3", "POCO X3 Pro", "POCO M3 Pro"],
    2022: ["POCO F4", "POCO X4 Pro", "POCO M4 Pro"],
    2023: ["POCO F5", "POCO X5 Pro", "POCO M5"],
    2024: ["POCO F6", "POCO X6", "POCO X6 Pro", "POCO M6 Pro"],
    2025: ["POCO F7", "POCO F7 Pro", "POCO X7", "POCO X7 Pro"],
  },
  Motorola: {
    2021: ["Moto G30", "Moto G50", "Moto G60", "Motorola Edge 20", "Motorola Edge 20 Pro"],
    2022: ["Moto G52", "Moto G62", "Moto G82", "Motorola Edge 30", "Motorola Edge 30 Pro"],
    2023: ["Moto G54", "Moto G84", "Motorola Edge 40", "Motorola Edge 40 Pro", "Razr 40", "Razr 40 Ultra"],
    2024: ["Moto G64", "Moto G85", "Motorola Edge 50 Fusion", "Motorola Edge 50 Pro", "Motorola Edge 50 Ultra", "Razr 50", "Razr 50 Ultra"],
    2025: ["Moto G86", "Motorola Edge 60 Fusion", "Motorola Edge 60 Pro", "Razr 60", "Razr 60 Ultra"],
  },
  OPPO: {
    2021: ["OPPO Find X3 Pro", "OPPO Reno6", "OPPO Reno6 Pro"],
    2022: ["OPPO Find X5", "OPPO Find X5 Pro", "OPPO Reno8", "OPPO Reno8 Pro"],
    2023: ["OPPO Find X6 Pro", "OPPO Reno10", "OPPO Reno10 Pro"],
    2024: ["OPPO Find X7 Ultra", "OPPO Reno12", "OPPO Reno12 Pro"],
    2025: ["OPPO Find X8", "OPPO Find X8 Pro", "OPPO Reno13", "OPPO Reno13 Pro"],
  },
  vivo: {
    2021: ["vivo X60", "vivo X60 Pro", "vivo V21"],
    2022: ["vivo X80", "vivo X80 Pro", "vivo V25", "vivo V25 Pro"],
    2023: ["vivo X90", "vivo X90 Pro", "vivo V27", "vivo V29"],
    2024: ["vivo X100", "vivo X100 Pro", "vivo V30", "vivo V40"],
    2025: ["vivo X200", "vivo X200 Pro", "vivo V50"],
  },
  realme: {
    2021: ["realme GT", "realme GT Master Edition", "realme 8 Pro"],
    2022: ["realme GT 2", "realme GT 2 Pro", "realme 9 Pro+"],
    2023: ["realme GT 3", "realme 11 Pro", "realme 11 Pro+"],
    2024: ["realme GT 6", "realme 12 Pro", "realme 12 Pro+", "realme 13 Pro", "realme 13 Pro+"],
    2025: ["realme GT 7 Pro", "realme 14 Pro", "realme 14 Pro+"],
  },
  Nothing: { 2022: ["Nothing Phone (1)"], 2023: ["Nothing Phone (2)", "Nothing Phone (2a)"], 2024: ["Nothing Phone (2a) Plus", "CMF Phone 1"], 2025: ["Nothing Phone (3a)", "Nothing Phone (3a) Pro", "Nothing Phone (3)"] },
  Huawei: { 2020: ["P40", "P40 Pro", "Mate 40 Pro"], 2021: ["P50 Pro"], 2022: ["Mate 50 Pro"], 2023: ["P60 Pro", "Mate 60 Pro"], 2024: ["Pura 70", "Pura 70 Pro", "Pura 70 Ultra", "Mate 70 Pro"] },
  Sony: { 2021: ["Xperia 1 III", "Xperia 5 III", "Xperia 10 III"], 2022: ["Xperia 1 IV", "Xperia 5 IV", "Xperia 10 IV"], 2023: ["Xperia 1 V", "Xperia 5 V", "Xperia 10 V"], 2024: ["Xperia 1 VI", "Xperia 10 VI"] },
  ASUS: { 2021: ["ROG Phone 5", "Zenfone 8"], 2022: ["ROG Phone 6", "Zenfone 9"], 2023: ["ROG Phone 7", "Zenfone 10"], 2024: ["ROG Phone 8", "Zenfone 11 Ultra"], 2025: ["ROG Phone 9"] },
  Nokia: { 2021: ["Nokia X20", "Nokia G50"], 2022: ["Nokia X30", "Nokia G60"], 2023: ["Nokia G42", "Nokia X30"], 2024: ["Nokia XR21", "Nokia G42"] },
};

const storageOptions = (modelName) => {
  if (/Ultra|Pro Max|Pro$|Fold|Flip|ROG|Xperia 1|Find X|X\d{2,3} Pro/.test(modelName)) return ["256GB", "512GB", "1TB"];
  if (/mini|SE|A\d{2}$|G\d{2}$|M\d|CE|Lite|a\)|Xperia 10/.test(modelName)) return ["64GB", "128GB", "256GB"];
  return ["128GB", "256GB", "512GB"];
};

const otherDeviceCatalog = {
  Tablets: {
    "Apple iPad": {
      "iPad (9th generation)": ["64GB - Wi-Fi", "256GB - Wi-Fi", "64GB - Wi-Fi + Cellular"],
      "iPad (10th generation)": ["64GB - Wi-Fi", "256GB - Wi-Fi", "64GB - Wi-Fi + Cellular"],
      "iPad (A16)": ["128GB - Wi-Fi", "256GB - Wi-Fi", "512GB - Wi-Fi + Cellular"],
      "iPad mini (6th generation)": ["64GB - Wi-Fi", "256GB - Wi-Fi + Cellular"],
      "iPad mini (A17 Pro)": ["128GB - Wi-Fi", "256GB - Wi-Fi + Cellular", "512GB - Wi-Fi + Cellular"],
      "iPad Air (5th generation)": ["64GB - Wi-Fi", "256GB - Wi-Fi + Cellular"],
      "iPad Air 11-inch (M2)": ["128GB - Wi-Fi", "256GB - Wi-Fi", "512GB - Wi-Fi + Cellular", "1TB - Wi-Fi + Cellular"],
      "iPad Air 13-inch (M2)": ["128GB - Wi-Fi", "256GB - Wi-Fi", "512GB - Wi-Fi + Cellular", "1TB - Wi-Fi + Cellular"],
      "iPad Pro 11-inch (M4)": ["256GB - Wi-Fi", "512GB - Wi-Fi", "1TB - Wi-Fi + Cellular", "2TB - Wi-Fi + Cellular"],
      "iPad Pro 13-inch (M4)": ["256GB - Wi-Fi", "512GB - Wi-Fi", "1TB - Wi-Fi + Cellular", "2TB - Wi-Fi + Cellular"],
    },
    "Samsung Galaxy Tab": {
      "Galaxy Tab S8": ["128GB - Wi-Fi", "256GB - 5G"], "Galaxy Tab S8+": ["128GB - Wi-Fi", "256GB - 5G"], "Galaxy Tab S8 Ultra": ["256GB - Wi-Fi", "512GB - 5G"],
      "Galaxy Tab S9": ["128GB - Wi-Fi", "256GB - 5G"], "Galaxy Tab S9+": ["256GB - Wi-Fi", "512GB - 5G"], "Galaxy Tab S9 Ultra": ["256GB - Wi-Fi", "512GB - 5G"],
      "Galaxy Tab S10+": ["256GB - Wi-Fi", "512GB - 5G"], "Galaxy Tab S10 Ultra": ["256GB - Wi-Fi", "512GB - 5G"],
      "Galaxy Tab A9": ["64GB - Wi-Fi", "128GB - LTE"], "Galaxy Tab A9+": ["64GB - Wi-Fi", "128GB - 5G"],
    },
    Lenovo: { "Tab P11 Pro": ["128GB - Wi-Fi", "256GB - Wi-Fi"], "Tab P12": ["128GB - Wi-Fi", "256GB - Wi-Fi"], "Legion Tab": ["256GB - Wi-Fi", "512GB - Wi-Fi"] },
    "Microsoft Surface": { "Surface Pro 9": ["i5 / 8GB / 128GB", "i7 / 16GB / 512GB"], "Surface Pro 10": ["Core Ultra 5 / 8GB / 256GB", "Core Ultra 7 / 16GB / 512GB"] },
  },
  Computers: {
    Apple: {
      "MacBook Air 13-inch (M2)": ["M2 / 8GB / 256GB SSD", "M2 / 16GB / 512GB SSD"], "MacBook Air 15-inch (M2)": ["M2 / 8GB / 256GB SSD", "M2 / 16GB / 512GB SSD"],
      "MacBook Air 13-inch (M3)": ["M3 / 8GB / 256GB SSD", "M3 / 16GB / 512GB SSD"], "MacBook Air 15-inch (M3)": ["M3 / 8GB / 256GB SSD", "M3 / 16GB / 512GB SSD"],
      "MacBook Pro 14-inch (M3)": ["M3 / 8GB / 512GB SSD", "M3 Pro / 18GB / 512GB SSD"], "MacBook Pro 16-inch (M3 Pro)": ["M3 Pro / 18GB / 512GB SSD", "M3 Max / 36GB / 1TB SSD"],
      "Mac mini (M2)": ["M2 / 8GB / 256GB SSD", "M2 Pro / 16GB / 512GB SSD"], "iMac 24-inch (M3)": ["M3 / 8GB / 256GB SSD", "M3 / 16GB / 512GB SSD"],
    },
    Dell: {
      "XPS 13": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"], "XPS 14": ["Core Ultra 7 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"], "XPS 16": ["Core Ultra 7 / 16GB / 512GB SSD", "Core Ultra 9 / 32GB / 1TB SSD"],
      "Inspiron 14": ["Core i5 / 8GB / 512GB SSD", "Core i7 / 16GB / 1TB SSD"], "Alienware m16": ["Core i7 / 16GB / 1TB SSD", "Core i9 / 32GB / 1TB SSD"],
    },
    HP: {
      "Spectre x360 14": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"], "Envy x360 14": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 16GB / 1TB SSD"],
      "Pavilion 15": ["Core i5 / 8GB / 512GB SSD", "Core i7 / 16GB / 1TB SSD"], "Victus 16": ["Core i5 / 16GB / 512GB SSD", "Core i7 / 16GB / 1TB SSD"], "OMEN 16": ["Core i7 / 16GB / 1TB SSD", "Core i9 / 32GB / 1TB SSD"],
    },
    Lenovo: {
      "ThinkPad X1 Carbon": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"], "ThinkPad T14": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"],
      "Yoga 7": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 16GB / 1TB SSD"], "Legion 5": ["Ryzen 7 / 16GB / 1TB SSD", "Core i7 / 32GB / 1TB SSD"], "Legion Pro 7": ["Core i9 / 32GB / 1TB SSD", "Core i9 / 32GB / 2TB SSD"],
    },
    ASUS: {
      "Zenbook 14 OLED": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"], "Vivobook S 15": ["Core i5 / 16GB / 512GB SSD", "Core i7 / 16GB / 1TB SSD"],
      "ROG Zephyrus G14": ["Ryzen 7 / 16GB / 1TB SSD", "Ryzen 9 / 32GB / 1TB SSD"], "ROG Strix G16": ["Core i7 / 16GB / 1TB SSD", "Core i9 / 32GB / 1TB SSD"],
    },
    Acer: { "Swift Go 14": ["Core Ultra 5 / 16GB / 512GB SSD", "Core Ultra 7 / 32GB / 1TB SSD"], "Aspire 5": ["Core i5 / 8GB / 512GB SSD", "Core i7 / 16GB / 1TB SSD"], "Nitro V 15": ["Core i5 / 16GB / 512GB SSD", "Core i7 / 16GB / 1TB SSD"] },
    Microsoft: { "Surface Laptop 5": ["Core i5 / 8GB / 256GB SSD", "Core i7 / 16GB / 512GB SSD"], "Surface Laptop 7": ["Snapdragon X Plus / 16GB / 512GB SSD", "Snapdragon X Elite / 32GB / 1TB SSD"] },
  },
  "Gaming Devices": {
    Sony: { "PlayStation 4": ["500GB", "1TB"], "PlayStation 4 Pro": ["1TB"], "PlayStation 5": ["Disc Edition", "Digital Edition"], "PlayStation 5 Slim": ["Disc Edition", "Digital Edition"], "PlayStation 5 Pro": ["2TB Digital Edition"], "PlayStation Portal": ["Remote Player"] },
    Microsoft: { "Xbox One S": ["500GB", "1TB"], "Xbox One X": ["1TB"], "Xbox Series S": ["512GB", "1TB Carbon Black"], "Xbox Series X": ["1TB", "2TB Galaxy Black"], "Xbox Series X Digital Edition": ["1TB"], "Xbox Elite Wireless Controller Series 2": ["Core", "Full"] },
    Nintendo: { "Nintendo Switch": ["32GB"], "Nintendo Switch OLED": ["64GB"], "Nintendo Switch Lite": ["32GB"], "Nintendo Switch 2": ["256GB"] },
    Valve: { "Steam Deck": ["64GB eMMC", "256GB SSD", "512GB SSD"], "Steam Deck OLED": ["512GB SSD", "1TB SSD"] },
    ASUS: { "ROG Ally": ["Z1 / 512GB SSD", "Z1 Extreme / 512GB SSD"], "ROG Ally X": ["Z1 Extreme / 1TB SSD"] },
  },
};

const run = async () => {
  await connectDB();

  const category = await DeviceCategory.findOneAndUpdate(
    { name: "Smartphones" },
    { $setOnInsert: { name: "Smartphones", slug: "smartphones", sortOrder: 0, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let addedBrands = 0;
  let addedModels = 0;
  let addedVariants = 0;

  for (const [brandName, years] of Object.entries(phoneCatalog)) {
    let brand = await Brand.findOne({ name: brandName, deviceCategory: category._id });
    if (!brand) {
      brand = await Brand.create({ name: brandName, slug: slug(`smartphones-${brandName}`), deviceCategory: category._id, isActive: true });
      addedBrands += 1;
    }

    for (const [releaseYear, modelNames] of Object.entries(years)) {
      for (const modelName of modelNames) {
        let model = await DeviceModel.findOne({ brand: brand._id, slug: slug(modelName) });
        if (!model) {
          model = await DeviceModel.create({ name: modelName, slug: slug(modelName), brand: brand._id, deviceCategory: category._id, releaseYear: Number(releaseYear), isActive: true });
          addedModels += 1;
        }

        for (const storage of storageOptions(modelName)) {
          const label = `${storage} - 5G`;
          const exists = await DeviceVariant.exists({ deviceModel: model._id, label });
          if (!exists) {
            await DeviceVariant.create({ deviceModel: model._id, label, storage, network: "5G", isActive: true });
            addedVariants += 1;
          }
        }
      }
    }
  }

  for (const [categoryName, categoryBrands] of Object.entries(otherDeviceCatalog)) {
    const deviceCategory = await DeviceCategory.findOneAndUpdate(
      { name: categoryName },
      { $setOnInsert: { name: categoryName, slug: slug(categoryName), isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    for (const [brandName, catalogueModels] of Object.entries(categoryBrands)) {
      let brand = await Brand.findOne({ name: brandName, deviceCategory: deviceCategory._id });
      if (!brand) {
        brand = await Brand.create({ name: brandName, slug: slug(`${categoryName}-${brandName}`), deviceCategory: deviceCategory._id, isActive: true });
        addedBrands += 1;
      }

      for (const [modelName, labels] of Object.entries(catalogueModels)) {
        let model = await DeviceModel.findOne({ brand: brand._id, slug: slug(modelName) });
        if (!model) {
          model = await DeviceModel.create({ name: modelName, slug: slug(modelName), brand: brand._id, deviceCategory: deviceCategory._id, deviceType: categoryName === "Computers" ? "Laptop / Desktop" : "", isActive: true });
          addedModels += 1;
        }

        for (const label of labels) {
          if (await DeviceVariant.exists({ deviceModel: model._id, label })) continue;
          const [storage] = label.split(" - ");
          await DeviceVariant.create({
            deviceModel: model._id,
            label,
            storage: /GB|TB/.test(storage) ? storage : undefined,
            connectivity: /Wi-Fi|Cellular|LTE|5G/.test(label) ? label.replace(/^.* - /, "") : undefined,
            isActive: true,
          });
          addedVariants += 1;
        }
      }
    }
  }

  // One price per category + service is enough for every model in that category.
  // Administrators can later add a brand/model/variant row to override it.
  const defaultPriceList = {
    Smartphones: { "Screen Replacement": 99, "Battery Replacement": 59, "Charging Port Repair": 69, "Camera Repair": 79, "Water Damage Treatment": 89, "Software Diagnostics": 29, "General Diagnostics": 29 },
    Tablets: { "Screen Replacement": 129, "Battery Replacement": 79, "Charging Port Repair": 79, "Camera Repair": 89, "Water Damage Treatment": 99, "Software Diagnostics": 29, "General Diagnostics": 29 },
    Computers: { "Screen Replacement": 179, "Battery Replacement": 99, "Keyboard Replacement": 89, "RAM Upgrade": 69, "SSD/HDD Replacement": 99, "Water Damage Treatment": 119, "Software Diagnostics": 39, "General Diagnostics": 39 },
    "Gaming Devices": { "HDMI Port Repair": 89, "Controller Connectivity Fix": 39, "Software Diagnostics": 29, "General Diagnostics": 29, "Water Damage Treatment": 79 },
  };
  const categoryRecords = await DeviceCategory.find({ name: { $in: Object.keys(defaultPriceList) } });
  const repairServices = await RepairService.find({ isActive: true });
  let addedDefaultPrices = 0;
  for (const deviceCategory of categoryRecords) {
    for (const service of repairServices) {
      const regularPrice = defaultPriceList[deviceCategory.name]?.[service.name];
      if (!regularPrice) continue;
      const existingDefault = await RepairPrice.exists({
        deviceCategory: deviceCategory._id,
        repairService: service._id,
        brand: { $exists: false },
        deviceModel: { $exists: false },
        deviceVariant: { $exists: false },
      });
      if (!existingDefault) {
        await RepairPrice.create({ deviceCategory: deviceCategory._id, repairService: service._id, regularPrice, isActive: true });
        addedDefaultPrices += 1;
      }
    }
  }

  console.log(`Device catalogue complete. Added ${addedBrands} brands, ${addedModels} models, ${addedVariants} variants, and ${addedDefaultPrices} default repair prices. Existing data was preserved.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Device catalogue seed failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
