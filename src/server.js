import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV !== "production" || process.env.LOCAL_RUN === "true") {
  server = app.listen(PORT, () => {
    console.log(`JAM Smart Tech API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Export the Express API for serverless environments like Vercel
export default app;
