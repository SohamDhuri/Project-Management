import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import prisma from "./configs/prisma.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import clerkWebhookRouter from "./routes/clerkWebhookRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.send("Server is Live!"));

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use(clerkMiddleware());

// Routes
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/task", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);
app.use("/api/clerk-webhook", express.json(), clerkWebhookRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
});