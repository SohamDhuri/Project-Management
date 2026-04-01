import express from "express";
import prisma from "../configs/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const evt = req.body;

    if (evt.type === "organization.created") {
  const data = evt.data;

  // 1. Make sure the Clerk creator exists in User table
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

  // 2. Create or update workspace
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

  // 3. Create workspace membership for the owner
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
    //   await prisma.workspaceMember.upsert({
    //     where: {
    //       userId_workspaceId: {
    //         userId: data.created_by,
    //         workspaceId: data.id,
    //       },
    //     },
    //     update: {
    //       role: "ADMIN",
    //     },
    //     create: {
    //       userId: data.created_by,
    //       workspaceId: data.id,
    //       role: "ADMIN",
    //     },
    //   });
     

    if (evt.type === "organization.updated") {
      const data = evt.data;

      await prisma.workspace.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug: data.slug,
          image_url: data.image_url || "",
        },
      });
    }

    if (evt.type === "organization.deleted") {
      const data = evt.data;

      await prisma.workspace.delete({
        where: { id: data.id },
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;