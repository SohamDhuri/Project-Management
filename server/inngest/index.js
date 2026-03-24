import { clerkClient } from "@clerk/express";
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js"; // ✅ IMPORTANT
import { eventLoopUtilization } from "node:perf_hooks";

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

//Inngest Function to save data to a database
const syncWorkspaceCreation = inngest.createFunction(
  {id: 'sync-workspace-from-clerk'},
  {event: 'clerk/organization.created'},
  async ({ event }) => {
    const {data} = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      }
    })

    //Add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN"
      }
    })
  }

)

//Inngest Function to update workspace data in database
const syncWorkspaceUpdation = inngest.createFunction(
  {id: 'update-workspace-from-clerk'},
  {event: 'clerk/organization.updated'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspace.update({
      where: {
        id: data.id
      },
      data:{
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      }
    })
  }
)

//Inngest function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
  {id: 'delete-workspace-from-clerk'},
  {event: 'clerk/organization.deleted'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspace.delete({
      where: {
        id: data.id
      },
    })
  }
)

//Inngest function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
  {id: 'sync-workspace-member-from-clerk'},
  {event: 'clerk/organizationInvitation.accepted'},
  async({event}) => {
    const {data} = event;
    await prisma.workspaceMember.create({
      data : {
        userId: data.id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase()
      }
    })
  }
)

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceUpdation,
  syncWorkspaceMemberCreation
];