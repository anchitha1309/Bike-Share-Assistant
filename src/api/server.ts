import express from "express";
import cors from "cors";
import path from "path";
import { QueryProcessor } from "../services/queryProcessor";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Bike Share Assistant is running!" });
});

// Main query endpoint
app.post("/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Invalid request. Please provide a question.",
        sql: null,
        result: null,
      });
    }

    console.log(`🌐 API Request: "${question}"`);

    const processor = QueryProcessor.getInstance();
    const result = await processor.processQuery(question);

    // Format the response according to requirements
    const response = {
      sql: result.sql,
      result: result.result,
      error: result.error,
    };

    console.log(`✅ API Response: ${JSON.stringify(response, null, 2)}`);

    res.json(response);
  } catch (error) {
    console.error("❌ API Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
      sql: null,
      result: null,
    });
  }
});

// Sample questions endpoint for demo
app.get("/sample-questions", (req, res) => {
  const samples = [
    "How many women rode on rainy days?",
    "What was the average ride time from Congress Avenue?",
    "Which station had the most departures in March 2024?",
  ];

  res.json({ questions: samples });
});

// Serve the React app for any other routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../dist-frontend/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(
    `🚀 Bike Share Assistant Server running on http://localhost:${PORT}`,
  );
  console.log(`📊 API endpoint: http://localhost:${PORT}/query`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
});

export default app;
