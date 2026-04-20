import express from "express";
import prisma from "../configs/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const evt = req.body;
    console.log("Webhook event received:", evt.type);
    const data = evt.data;

    console.log("Webhook event received:", evt.type);

    if (evt.type === "user.created") {
      await prisma.user.upsert({
        where: { id: data.id },
        update: {
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          email:
            data.email_addresses?.[0]?.email_address ||
            `temp-${data.id}@example.com`,
          image: data.image_url || "",
        },
        create: {
          id: data.id,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          email:
            data.email_addresses?.[0]?.email_address ||
            `temp-${data.id}@example.com`,
          image: data.image_url || "",
        },
      });

      console.log("User synced:", data.id);
    }

    if (evt.type === "user.updated") {
      await prisma.user
        .update({
          where: { id: data.id },
          data: {
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
            email:
              data.email_addresses?.[0]?.email_address ||
              `temp-${data.id}@example.com`,
            image: data.image_url || "",
          },
        })
        .catch(() => null);

      console.log("User updated:", data.id);
    }

    if (evt.type === "user.deleted") {
      if (data?.id) {
        await prisma.user
          .delete({
            where: { id: data.id },
          })
          .catch(() => null);

        console.log("User deleted:", data.id);
      }
    }

    if (evt.type === "organization.created") {
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
      await prisma.workspace
        .update({
          where: { id: data.id },
          data: {
            name: data.name,
            slug: data.slug,
            image_url: data.image_url || "",
          },
        })
        .catch(() => null);

      console.log("Workspace updated:", data.id);
    }

    if (evt.type === "organization.deleted") {
      await prisma.workspace
        .delete({
          where: { id: data.id },
        })
        .catch(() => null);

      console.log("Workspace deleted:", data.id);
    }

    if (evt.type === "organizationMembership.created") {
      console.log(
        "organizationMembership.created payload:",
        JSON.stringify(data, null, 2)
      );

      const userId = data.public_user_data?.user_id;
      const email = data.public_user_data?.identifier;
      const name =
        `${data.public_user_data?.first_name || ""} ${data.public_user_data?.last_name || ""}`.trim() ||
        "User";
      const image = data.public_user_data?.image_url || "";

      const workspaceId = data.organization?.id || data.organization_id;
      const role = data.role === "org:admin" ? "ADMIN" : "MEMBER";

      console.log({ userId, workspaceId, role, email, name });

      if (userId && workspaceId) {
        await prisma.user.upsert({
          where: { id: userId },
          update: {
            name,
            email: email || `temp-${userId}@example.com`,
            image,
          },
          create: {
            id: userId,
            name,
            email: email || `temp-${userId}@example.com`,
            image,
          },
        });

        await prisma.workspaceMember.upsert({
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
          update: {
            role,
          },
          create: {
            userId,
            workspaceId,
            role,
          },
        });

        console.log("Workspace member synced:", { userId, workspaceId, role });
      } else {
        console.log("Missing membership data:", { userId, workspaceId });
      }
    }

    if (evt.type === "organizationMembership.deleted") {
      const userId = data.public_user_data?.user_id;
      const workspaceId = data.organization?.id || data.organization_id;

      if (userId && workspaceId) {
        await prisma.workspaceMember
          .delete({
            where: {
              userId_workspaceId: {
                userId,
                workspaceId,
              },
            },
          })
          .catch(() => null);

        console.log("Workspace member deleted:", { userId, workspaceId });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;