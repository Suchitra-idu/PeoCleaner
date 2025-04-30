import express from "express";
import dotenv from "dotenv";
import path from "path";
import { initializeDatabase } from "./db/database.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Parse JSON request bodies

// CORS Settup ( Allow requests from any origin)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Initialize the database
initializeDatabase().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

app.use("/api", userRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("PeoClean Cleaning Service Backend is running!");
});

// Minor error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

//Start the server on specific port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Database URL: ${process.env.DATABASE_URL}`);
});
