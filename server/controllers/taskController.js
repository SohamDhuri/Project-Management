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
    console.log("req.body:", req.body);

    const origin = req.get("origin");

    if (!projectId || !title || !assigneeId || !due_date) {
      return res.status(400).json({
        success: false,
        message: "projectId, title, assigneeId and due_date are required",
      });
    }

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
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have admin privileges for this project",
      });
    }

    const isMember = project.members.find(
      (member) => member.user.id === assigneeId
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "Assignee is not a member of this project",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        type,
        status,
        priority,
        project: {
          connect: { id: projectId },
        },
        assignee: {
          connect: { id: assigneeId },
        },
        due_date: new Date(due_date),
      },
      include: {
        assignee: true,
        comments: true,
        project: true,
      },
    });

    try {
      await inngest.send({
        name: "task/task.created",
        data: {
          taskId: task.id,
          title: task.title,
          projectId,
          assigneeId,
          origin,
        },
      });
    } catch (inngestError) {
      console.error("Inngest Error:", inngestError);
    }

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
        assignee: assigneeId
          ? {
              connect: { id: assigneeId },
            }
          : undefined,
        due_date: due_date ? new Date(due_date) : undefined,
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