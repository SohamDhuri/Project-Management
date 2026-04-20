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

        // Find current logged-in user
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if project exists and load members
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: { user: true },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Check if current user is project lead
        if (project.team_lead !== currentUser.email) {
            return res.status(403).json({
                message: "You don't have admin privileges for this project",
            });
        }

        // Check if assignee belongs to project members
        if (
            assigneeId &&
            !project.members.find((member) => member.user.id === assigneeId)
        ) {
            return res.status(404).json({
                message: "Assignee is not a member of this project",
            });
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                type,
                status,
                priority,
                assigneeId: assigneeId || null,
                due_date: due_date ? new Date(due_date) : null,
            },
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true },
        });

        await inngest.send({
            name: "app/task.assigned",
            data: {
                taskId: task.id,
                origin,
            },
        });

        return res.json({
            task: taskWithAssignee,
            message: "Task created successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.code || error.message,
        });
    }
};

// Update Task
export const updateTask = async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const { userId } = await req.auth();

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if project exists and load members
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: {
                members: {
                    include: { user: true },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.team_lead !== currentUser.email) {
            return res.status(403).json({
                message: "You don't have admin privileges for this project",
            });
        }

        // If assignee is being updated, validate membership
        if (
            req.body.assigneeId &&
            !project.members.find((member) => member.user.id === req.body.assigneeId)
        ) {
            return res.status(404).json({
                message: "Assignee is not a member of this project",
            });
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                due_date: req.body.due_date ? new Date(req.body.due_date) : req.body.due_date,
            },
            include: { assignee: true },
        });

        return res.json({
            task: updatedTask,
            message: "Task updated successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.code || error.message,
        });
    }
};

// Delete Task
export const deleteTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskIds } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: "taskIds are required" });
        }

        const tasks = await prisma.task.findMany({
            where: {
                id: { in: taskIds },
            },
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: {
                members: {
                    include: { user: true },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.team_lead !== currentUser.email) {
            return res.status(403).json({
                message: "You don't have admin privileges for this project",
            });
        }

        await prisma.task.deleteMany({
            where: {
                id: { in: taskIds },
            },
        });

        return res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.code || error.message,
        });
    }
};