import express from "express";
import prisma from "../configs/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const evt = req.body;

    if (evt.type === "user.created") {
      const data = evt.data;

      await prisma.user.upsert({
        where: { id: data.id },
        update: {
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          email: data.email_addresses?.[0]?.email_address || `temp-${data.id}@example.com`,
          image: data.image_url || "",
        },
        create: {
          id: data.id,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          email: data.email_addresses?.[0]?.email_address || `temp-${data.id}@example.com`,
          image: data.image_url || "",
        },
      });

      console.log("User synced:", data.id);
    }

    if (evt.type === "user.updated") {
      const data = evt.data;

      await prisma.user.update({
        where: { id: data.id },
        data: {
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          email: data.email_addresses?.[0]?.email_address || `temp-${data.id}@example.com`,
          image: data.image_url || "",
        },
      }).catch(() => null);

      console.log("User updated:", data.id);
    }

    if (evt.type === "user.deleted") {
      const data = evt.data;

      if (data?.id) {
        await prisma.user.delete({
          where: { id: data.id },
        }).catch(() => null);

        console.log("User deleted:", data.id);
      }
    }

    if (evt.type === "organization.created") {
      const data = evt.data;

      await prisma.user.upsert({
        where: { id: data.created_by },
        update: {},
        create: {
          id: data.created_by,
          name: "Workspace Owner",
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

      console.log("Workspace synced:", data.name);
    }

    if (evt.type === "organization.updated") {
      const data = evt.data;

      await prisma.workspace.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug: data.slug,
          image_url: data.image_url || "",
        },
      }).catch(() => null);

      console.log("Workspace updated:", data.id);
    }

    if (evt.type === "organization.deleted") {
      const data = evt.data;

      await prisma.workspace.delete({
        where: { id: data.id },
      }).catch(() => null);

      console.log("Workspace deleted:", data.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;