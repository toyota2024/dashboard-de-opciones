import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { marketRoutes } from "./routes/marketRoutes.js";
import { optionsRoutes } from "./routes/optionsRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const provider = (process.env.DATA_PROVIDER ?? "mock").toLowerCase();
const allowedOrigins = new Set(["http://localhost:5173", "http://localhost:5174"]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    provider,
    marketData: provider === "alpaca" ? "alpaca" : "mock",
    optionsData: "mock",
    optionsDataAvailable: "unknown",
  });
});

app.use("/api/market", marketRoutes);
app.use("/api/options", optionsRoutes);

app.listen(port, () => {
  console.log(`Options projection API listening on http://localhost:${port}`);
});
