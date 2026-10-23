import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    condition: { type: String, enum: ["", "Refurbished", "To Repair"], default: "Refurbished" },
    description: { type: String, default: "" },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    translations: {
      type: new mongoose.Schema(
        {
          fr: new mongoose.Schema(
            { name: String, description: String, features: [String] },
            { _id: false }
          ),
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Grade", gradeSchema);
