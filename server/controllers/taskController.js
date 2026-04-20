import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

// Create Task
export const createTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body;

    const origin = req.get("origin");

    // Check if project exists and load members
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check admin/team lead permission
    if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "You don't have admin privileges for this project" });
    }

    // Check assignee belongs to project
    if (
      assigneeId &&
      !project.members.find((member) => member.user.id === assigneeId)
    ) {
      return res
        .status(404)
        .json({ message: "Assignee is not a member of this project" });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        type,
        status,
        priority,
        due_date: due_date ? new Date(due_date) : null,
        project: {
          connect: { id: projectId },
        },
        assignee: assigneeId
          ? {
              connect: { id: assigneeId },
            }
          : undefined,
      },
    });

    await inngest.send({
      name: "task/task.created",
      data: {
        taskId: task.id,
        title: task.title,
        projectId,
        assigneeId: assigneeId || null,
        origin,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update Task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, status, priority, assigneeId, due_date } =
      req.body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        type,
        status,
        priority,
        due_date: due_date ? new Date(due_date) : undefined,
        assignee: assigneeId
          ? {
              connect: { id: assigneeId },
            }
          : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Delete Task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.body;

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};