import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { router } from "./routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", router);
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
});

app.listen(env.port, () => {
  console.log(`CRM API running on http://localhost:${env.port}`);
});
