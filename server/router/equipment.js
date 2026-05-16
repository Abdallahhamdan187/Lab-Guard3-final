import express from "express";
import {addEquipment, getEquipment, updateEquipment} from "../controller/equipment.js";
import {authorizeRoles} from "../middleware/role.js";

const router = express.Router();

router.get("/", getEquipment);
router.post("/",addEquipment)
router.patch("/update",authorizeRoles("lab-assistant"),updateEquipment)
export default router