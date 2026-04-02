import express from "express";
import prisma from "../configs/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const evt = req.body;

    if (evt.type === "organization.created") {
      const data = evt.data;

      await prisma.user.upsert({
        where: { id: data.created_by },
        update: {},
        create: {
          id: data.created_by,
          name: data.name || "Workspace Owner",
          email: `temp-${data.created_by}@example.com`,
          image: "",
        },
      });

      await prisma.workspace.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          slug: data.slug,
          image_url: data.image_url || "",
          ownerId: data.created_by,
        },
        create: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          image_url: data.image_url || "",
          ownerId: data.created_by,
        },
      });

      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: data.created_by,
            workspaceId: data.id,
          },
        },
        update: {},
        create: {
          userId: data.created_by,
          workspaceId: data.id,
          role: "ADMIN",
        },
      });

      console.log("Workspace synced successfully:", data.name);
    }

    if (evt.type === "organization.updated") {
      const data = evt.data;

      const existingWorkspace = await prisma.workspace.findUnique({
        where: { id: data.id },
      });

      if (existingWorkspace) {
        await prisma.workspace.update({
          where: { id: data.id },
          data: {
            name: data.name,
            slug: data.slug,
            image_url: data.image_url || "",
          },
        });

        console.log("Workspace updated successfully:", data.name);
      } else {
        console.log("Workspace not found for organization.updated:", data.id);
      }
    }

    if (evt.type === "organization.deleted") {
      const data = evt.data;

      const existingWorkspace = await prisma.workspace.findUnique({
        where: { id: data.id },
      });

      if (existingWorkspace) {
        await prisma.workspace.delete({
          where: { id: data.id },
        });

        console.log("Workspace deleted successfully:", data.id);
      } else {
        console.log("Workspace not found for organization.deleted:", data.id);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;