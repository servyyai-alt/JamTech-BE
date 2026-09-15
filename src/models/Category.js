import mongoose from "mongoose";

// E-commerce product category (Smartphones, Chargers, Cases, Repair Parts, etc.)
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "" },
    image: { type: String, default: "" },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    translations: {
      type: new mongoose.Schema(
        {
          fr: new mongoose.Schema({ name: String, description: String }, { _id: false }),
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
