import { clerkClient } from "@clerk/express";
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js"; // ✅ IMPORTANT

export const inngest = new Inngest({ id: "my-app" });

// Create user
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: { event: "clerk/user.created" },
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      },
    });
  }
);

// Delete user
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: { event: "clerk/user.deleted" },
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  }
);

// Update user
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: { event: "clerk/user.updated" },
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      },
    });
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
];