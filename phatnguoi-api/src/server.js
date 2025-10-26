import express from "express";
import { callAPI } from "./apiCaller.js";

const app = express();
const port = 3033;

app.get("/api", async (req, res) => {
  const { licensePlate } = req.query;

  if (!licensePlate) {
    return res.status(400).json({ error: "License plate is required" });
  }

  try {
    const violations = await callAPI(licensePlate);
    if (violations) {
      res.json({ licensePlate, violations });
    } else {
      res.status(404).json({ error: "No violations found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
