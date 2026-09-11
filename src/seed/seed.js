import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import slugify from "slugify";
import connectDB from "../config/db.js";

import User from "../models/User.js";
import DeviceCategory from "../models/DeviceCategory.js";
import Brand from "../models/Brand.js";
import DeviceModel from "../models/DeviceModel.js";
import DeviceVariant from "../models/DeviceVariant.js";
import RepairService from "../models/RepairService.js";
import RepairPrice from "../models/RepairPrice.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";

const slug = (s) => slugify(s, { lower: true, strict: true });

const run = async () => {
  await connectDB();
  console.log("Clearing existing catalog & sample data...");
  await Promise.all([
    DeviceCategory.deleteMany(), Brand.deleteMany(), DeviceModel.deleteMany(), DeviceVariant.deleteMany(),
    RepairService.deleteMany(), RepairPrice.deleteMany(), Category.deleteMany(), Product.deleteMany(), Settings.deleteMany(),
  ]);

  // ---- Admin user ----
  const adminEmail = "admin@jamsmarttech.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: "JAM Admin", email: adminEmail, password: "Admin@12345", role: "admin" });
    console.log(`Admin created: ${adminEmail} / Admin@12345`);
  }

  // ---- Settings ----
  await Settings.create({});

  // ---- Device Categories ----
  const categoryNames = ["Smartphones", "Tablets", "Computers", "Gaming Devices"];
  const categories = {};
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    categories[name] = await DeviceCategory.create({ name, slug: slug(name), sortOrder: i, isActive: true });
  }

  // ---- Brands per category ----
  const brandData = {
    Smartphones: ["Apple", "Samsung", "Google Pixel", "OnePlus", "Xiaomi", "Motorola"],
    Tablets: ["Apple iPad", "Samsung Galaxy Tab", "Microsoft Surface", "Lenovo"],
    Computers: ["Apple", "Dell", "HP", "Lenovo", "ASUS"],
    "Gaming Devices": ["Sony", "Microsoft", "Nintendo"],
  };
  const brands = {};
  for (const [catName, brandNames] of Object.entries(brandData)) {
    for (let i = 0; i < brandNames.length; i++) {
      const bName = brandNames[i];
      const key = `${catName}:${bName}`;
      brands[key] = await Brand.create({
        name: bName, slug: slug(`${catName}-${bName}`), deviceCategory: categories[catName]._id, sortOrder: i, isActive: true,
      });
    }
  }

  // ---- Models + Variants ----
  const models = {};
  const variants = {};

  const addModel = async (catName, brandKey, modelName, deviceType = "") => {
    const m = await DeviceModel.create({
      name: modelName, slug: slug(modelName), brand: brands[brandKey]._id, deviceCategory: categories[catName]._id, deviceType, isActive: true,
    });
    models[`${brandKey}:${modelName}`] = m;
    return m;
  };

  const addVariant = async (modelKey, label, extra = {}) => {
    const v = await DeviceVariant.create({ deviceModel: models[modelKey]._id, label, ...extra, isActive: true });
    variants[`${modelKey}:${label}`] = v;
    return v;
  };

  // Smartphones
  await addModel("Smartphones", "Smartphones:Apple", "iPhone 16 Pro");
  await addVariant("Smartphones:Apple:iPhone 16 Pro", "128GB - Natural Titanium", { storage: "128GB", color: "Natural Titanium", network: "5G" });
  await addVariant("Smartphones:Apple:iPhone 16 Pro", "256GB - Black Titanium", { storage: "256GB", color: "Black Titanium", network: "5G" });

  await addModel("Smartphones", "Smartphones:Apple", "iPhone 15");
  await addVariant("Smartphones:Apple:iPhone 15", "128GB - Blue", { storage: "128GB", color: "Blue", network: "5G" });

  await addModel("Smartphones", "Smartphones:Samsung", "Galaxy S24 Ultra");
  await addVariant("Smartphones:Samsung:Galaxy S24 Ultra", "256GB - Titanium Gray", { storage: "256GB", color: "Titanium Gray", network: "5G" });

  await addModel("Smartphones", "Smartphones:Google Pixel", "Pixel 9 Pro");
  await addVariant("Smartphones:Google Pixel:Pixel 9 Pro", "128GB - Obsidian", { storage: "128GB", color: "Obsidian", network: "5G" });

  await addModel("Smartphones", "Smartphones:OnePlus", "OnePlus 12");
  await addVariant("Smartphones:OnePlus:OnePlus 12", "256GB - Flowy Emerald", { storage: "256GB", color: "Flowy Emerald", network: "5G" });

  // Tablets
  await addModel("Tablets", "Tablets:Apple iPad", "iPad Pro 12.9-inch");
  await addVariant("Tablets:Apple iPad:iPad Pro 12.9-inch", "256GB - Wi-Fi - Space Gray", { storage: "256GB", connectivity: "Wi-Fi", color: "Space Gray", screenSize: "12.9-inch" });

  await addModel("Tablets", "Tablets:Samsung Galaxy Tab", "Galaxy Tab S9");
  await addVariant("Tablets:Samsung Galaxy Tab:Galaxy Tab S9", "128GB - Wi-Fi - Graphite", { storage: "128GB", connectivity: "Wi-Fi", color: "Graphite" });

  // Computers
  await addModel("Computers", "Computers:Apple", "MacBook Pro 14-inch", "Laptop");
  await addVariant("Computers:Apple:MacBook Pro 14-inch", "M3 Pro / 18GB / 512GB", { processor: "M3 Pro", ram: "18GB", storage: "512GB SSD" });

  await addModel("Computers", "Computers:Dell", "XPS 15", "Laptop");
  await addVariant("Computers:Dell:XPS 15", "i7 / 16GB / 1TB", { processor: "Intel i7", ram: "16GB", storage: "1TB SSD" });

  await addModel("Computers", "Computers:HP", "Spectre x360", "Laptop");
  await addVariant("Computers:HP:Spectre x360", "i7 / 16GB / 512GB", { processor: "Intel i7", ram: "16GB", storage: "512GB SSD" });

  // Gaming Devices (no variants needed)
  await addModel("Gaming Devices", "Gaming Devices:Sony", "PlayStation 5");
  await addModel("Gaming Devices", "Gaming Devices:Sony", "PlayStation 5 Slim");
  await addModel("Gaming Devices", "Gaming Devices:Sony", "PlayStation 4");
  await addModel("Gaming Devices", "Gaming Devices:Microsoft", "Xbox Series X");
  await addModel("Gaming Devices", "Gaming Devices:Microsoft", "Xbox Series S");
  await addModel("Gaming Devices", "Gaming Devices:Nintendo", "Nintendo Switch OLED");

  // ---- Repair Services ----
  const serviceDefs = [
    { name: "Screen Replacement", est: "45-60 min", warranty: "90 days", short: "Cracked or unresponsive screen replaced with a genuine display." },
    { name: "Battery Replacement", est: "30 min", warranty: "12 months", short: "Restore full battery life with a genuine replacement battery." },
    { name: "Charging Port Repair", est: "60 min", warranty: "90 days", short: "Fix loose or non-charging ports." },
    { name: "Camera Repair", est: "45 min", warranty: "90 days", short: "Repair blurry, cracked, or non-functional cameras." },
    { name: "Water Damage Treatment", est: "24-48 hrs", warranty: "30 days", short: "Professional cleaning and component-level repair." },
    { name: "Software Diagnostics", est: "Same day", warranty: "N/A", short: "Full diagnostics and software troubleshooting." },
    { name: "Keyboard Replacement", est: "60 min", warranty: "90 days", short: "Replace damaged or unresponsive laptop keyboards." },
    { name: "RAM Upgrade", est: "30 min", warranty: "12 months", short: "Boost performance with additional memory." },
    { name: "SSD/HDD Replacement", est: "45 min", warranty: "12 months", short: "Upgrade or replace failing storage drives." },
    { name: "HDMI Port Repair", est: "60 min", warranty: "90 days", short: "Fix damaged HDMI output ports on consoles." },
    { name: "Controller Connectivity Fix", est: "30 min", warranty: "60 days", short: "Resolve pairing and connectivity issues." },
    { name: "General Diagnostics", est: "30 min", warranty: "N/A", short: "Full inspection to identify the root issue." },
  ];

  const allCategoryIds = Object.values(categories).map((c) => c._id);
  const allBrandIds = Object.values(brands).map((b) => b._id);
  const allModelIds = Object.values(models).map((m) => m._id);

  const services = {};
  for (const s of serviceDefs) {
    services[s.name] = await RepairService.create({
      name: s.name, slug: slug(s.name), shortDescription: s.short, fullDescription: s.short,
      estimatedTime: s.est, warranty: s.warranty,
      compatibleCategories: allCategoryIds, compatibleBrands: allBrandIds, compatibleModels: allModelIds,
      isActive: true,
    });
  }

  // ---- Repair Pricing (category > brand > model > variant > service) ----
  const addPrice = async (modelKey, serviceName, regularPrice, discountPrice, variantKey) => {
    const model = models[modelKey];
    // derive brand & category from model doc
    await RepairPrice.create({
      deviceCategory: model.deviceCategory,
      brand: model.brand,
      deviceModel: model._id,
      deviceVariant: variantKey ? variants[variantKey]?._id : undefined,
      repairService: services[serviceName]._id,
      regularPrice, discountPrice,
      isActive: true,
    });
  };

  await addPrice("Smartphones:Apple:iPhone 16 Pro", "Screen Replacement", 329, 299);
  await addPrice("Smartphones:Apple:iPhone 16 Pro", "Battery Replacement", 99, undefined);
  await addPrice("Smartphones:Apple:iPhone 16 Pro", "Camera Repair", 149, undefined);
  await addPrice("Smartphones:Apple:iPhone 15", "Screen Replacement", 279, 249);
  await addPrice("Smartphones:Apple:iPhone 15", "Battery Replacement", 89, undefined);
  await addPrice("Smartphones:Samsung:Galaxy S24 Ultra", "Screen Replacement", 349, 319);
  await addPrice("Smartphones:Samsung:Galaxy S24 Ultra", "Battery Replacement", 95, undefined);
  await addPrice("Smartphones:Google Pixel:Pixel 9 Pro", "Screen Replacement", 299, undefined);
  await addPrice("Smartphones:OnePlus:OnePlus 12", "Charging Port Repair", 79, undefined);

  await addPrice("Tablets:Apple iPad:iPad Pro 12.9-inch", "Screen Replacement", 399, 359);
  await addPrice("Tablets:Apple iPad:iPad Pro 12.9-inch", "Battery Replacement", 129, undefined);
  await addPrice("Tablets:Samsung Galaxy Tab:Galaxy Tab S9", "Screen Replacement", 279, undefined);

  await addPrice("Computers:Apple:MacBook Pro 14-inch", "Keyboard Replacement", 199, undefined);
  await addPrice("Computers:Apple:MacBook Pro 14-inch", "SSD/HDD Replacement", 249, 219);
  await addPrice("Computers:Apple:MacBook Pro 14-inch", "Battery Replacement", 179, undefined);
  await addPrice("Computers:Dell:XPS 15", "RAM Upgrade", 129, undefined);
  await addPrice("Computers:Dell:XPS 15", "Screen Replacement", 249, undefined);
  await addPrice("Computers:HP:Spectre x360", "Keyboard Replacement", 179, undefined);

  await addPrice("Gaming Devices:Sony:PlayStation 5", "HDMI Port Repair", 89, undefined);
  await addPrice("Gaming Devices:Sony:PlayStation 5", "General Diagnostics", 29, undefined);
  await addPrice("Gaming Devices:Sony:PlayStation 5 Slim", "HDMI Port Repair", 89, undefined);
  await addPrice("Gaming Devices:Microsoft:Xbox Series X", "HDMI Port Repair", 85, undefined);
  await addPrice("Gaming Devices:Microsoft:Xbox Series S", "Controller Connectivity Fix", 39, undefined);
  await addPrice("Gaming Devices:Nintendo:Nintendo Switch OLED", "Screen Replacement", 129, undefined);
  await addPrice("Gaming Devices:Nintendo:Nintendo Switch OLED", "Controller Connectivity Fix", 35, undefined);

  // ---- E-commerce Categories ----
  const ecomCategoryNames = [
    "Smartphones", "Tablets", "Computers", "Gaming Devices", "Phone Cases", "Screen Protectors",
    "Chargers", "Cables", "Power Banks", "Earphones", "Headphones", "Smart Watches", "Adapters", "Repair Parts",
  ];
  const ecomCategories = {};
  for (let i = 0; i < ecomCategoryNames.length; i++) {
    const name = ecomCategoryNames[i];
    ecomCategories[name] = await Category.create({ name, slug: slug(`shop-${name}`), sortOrder: i, isActive: true });
  }

  // ---- Products (15+) ----
  const products = [
    { title: "iPhone 15 128GB", brand: "Apple", category: "Smartphones", price: 799, sale: 749, stock: 25, img: "https://images.unsplash.com/photo-1592286927505-1def25115481?w=600&q=80", featured: true, best: true },
    { title: "Samsung Galaxy S24 Ultra 256GB", brand: "Samsung", category: "Smartphones", price: 1199, sale: 1099, stock: 18, img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80", featured: true },
    { title: "Google Pixel 9 Pro 128GB", brand: "Google", category: "Smartphones", price: 999, stock: 14, img: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&q=80" },
    { title: "iPad Pro 12.9-inch 256GB", brand: "Apple", category: "Tablets", price: 1099, sale: 999, stock: 12, img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80", featured: true },
    { title: "Samsung Galaxy Tab S9", brand: "Samsung", category: "Tablets", price: 849, stock: 10, img: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80" },
    { title: "MacBook Pro 14-inch M3 Pro", brand: "Apple", category: "Computers", price: 2399, sale: 2199, stock: 8, img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80", featured: true, best: true },
    { title: "Dell XPS 15", brand: "Dell", category: "Computers", price: 1799, stock: 9, img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80" },
    { title: "PlayStation 5 Slim", brand: "Sony", category: "Gaming Devices", price: 549, stock: 20, img: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&q=80", best: true },
    { title: "Xbox Series X", brand: "Microsoft", category: "Gaming Devices", price: 499, stock: 15, img: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&q=80" },
    { title: "Nintendo Switch OLED", brand: "Nintendo", category: "Gaming Devices", price: 349, sale: 319, stock: 22, img: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80", best: true },
    { title: "Premium Silicone Phone Case", brand: "JAM Accessories", category: "Phone Cases", price: 24.99, sale: 19.99, stock: 120, img: "https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80" },
    { title: "Tempered Glass Screen Protector (2-Pack)", brand: "JAM Accessories", category: "Screen Protectors", price: 14.99, stock: 200, img: "https://images.unsplash.com/photo-1592286927505-1def25115481?w=600&q=80" },
    { title: "65W USB-C Fast Charger", brand: "Anker", category: "Chargers", price: 39.99, sale: 34.99, stock: 80, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80", featured: true },
    { title: "USB-C to USB-C Cable 2m", brand: "JAM Accessories", category: "Cables", price: 12.99, stock: 150, img: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&q=80" },
    { title: "20,000mAh Power Bank", brand: "Anker", category: "Power Banks", price: 49.99, sale: 44.99, stock: 60, img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80", best: true },
    { title: "Wireless Bluetooth Earbuds", brand: "JAM Audio", category: "Earphones", price: 59.99, sale: 49.99, stock: 90, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80", featured: true },
    { title: "Over-Ear Noise Cancelling Headphones", brand: "JAM Audio", category: "Headphones", price: 149.99, stock: 40, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" },
    { title: "Smart Watch Series 9", brand: "Apple", category: "Smart Watches", price: 429, sale: 399, stock: 30, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", featured: true },
    { title: "USB-C to HDMI Adapter", brand: "JAM Accessories", category: "Adapters", price: 19.99, stock: 100, img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80" },
    { title: "Replacement Battery Kit (Universal)", brand: "JAM Parts", category: "Repair Parts", price: 34.99, stock: 70, img: "https://images.unsplash.com/photo-1620825141359-a5f5514b7b41?w=600&q=80" },
  ];

  for (const p of products) {
    await Product.create({
      title: p.title, slug: slug(p.title), brand: p.brand, category: ecomCategories[p.category]._id,
      images: [p.img], shortDescription: `${p.title} — premium quality, fast delivery.`,
      description: `The ${p.title} offers premium build quality, reliable performance and genuine warranty coverage. A great addition to your device setup.`,
      regularPrice: p.price, salePrice: p.sale, stock: p.stock,
      warranty: "12 months", returnsPolicy: "14 day returns", deliveryEstimate: "2-4 business days",
      isFeatured: !!p.featured, isBestSeller: !!p.best, isActive: true,
      rating: 4 + Math.random(), numReviews: Math.floor(Math.random() * 60) + 5,
      specifications: [{ key: "Brand", value: p.brand }, { key: "Category", value: p.category }],
    });
  }

  console.log(`Seed complete: ${categoryNames.length} device categories, ${Object.keys(brands).length} brands, ${Object.keys(models).length} models, ${Object.keys(services).length} repair services, ${products.length} products.`);
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
