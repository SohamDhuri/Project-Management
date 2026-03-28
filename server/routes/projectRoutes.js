import express from "express";
import { addMember, createProject, updateProject } from "../controllers/projectControllers.js";

const projectRouter = express.Router();

projectRouter.post('/', createProject)
projectRouter.post('/', updateProject)
projectRouter.post('/:projectId/addMember', addMember)

export default projectRouter
