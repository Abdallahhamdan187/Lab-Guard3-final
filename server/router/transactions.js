import express from "express";
import {
    getTransactions,
    approveTransaction,
    denyTransaction,
} from "../controller/transactions.js"
import {authorizeRoles} from "../middleware/role.js";
const router = express.Router()
router.get("/",authorizeRoles("instructor"),getTransactions)
router.patch("/:txnId/approve",authorizeRoles("instructor"),approveTransaction)
router.patch("/:txnId/deny",authorizeRoles("instructor"),denyTransaction)
export default router
