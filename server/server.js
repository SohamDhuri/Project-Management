import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import clerkWebhookRouter from "./routes/clerkWebhookRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("Server is Live!"));

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/task", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);
app.use("/api/clerk-webhook", clerkWebhookRouter);

export default app;