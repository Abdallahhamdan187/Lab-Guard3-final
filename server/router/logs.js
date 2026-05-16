import express from "express"
import {getLogs} from "../controller/logs.js";
import {authorizeRoles} from "../middleware/role.js";
const route = express.Router()
route.get("/",authorizeRoles("admin"),getLogs)
export default route