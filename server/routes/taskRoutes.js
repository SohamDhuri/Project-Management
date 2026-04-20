import express from "express";
import { createTask, deleteTask, updateTask } from "../controllers/taskController.js";

const taskRouter = express.Router()

taskRouter.post('/', createTask)
taskRouter.post('/delete', deleteTask)
taskRouter.post('/:id', updateTask)


export default taskRouter