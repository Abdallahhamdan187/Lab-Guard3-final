import express from "express"
import {getUsers,register} from "../controller/users.js";
import {authorizeRoles} from "../middleware/role.js";
import {addTransaction, getMyTransactions, returnTransaction} from "../controller/transactions.js";
import {getMyNotifications, markAllNotificationsRead, markNotificationRead} from "../controller/notifications.js";

const route = express.Router()

route.get("/",authorizeRoles("admin"),getUsers)
route.get("/me/transactions",getMyTransactions)
route.post("/me/transactions",addTransaction)
route.patch("/me/transactions/:txnId/return",returnTransaction)

route.get("/me/notifications",getMyNotifications)
route.patch("/me/notifications/read-all",markAllNotificationsRead)
route.patch("/me/notifications/:id/read",markNotificationRead)

route.post("/",authorizeRoles("admin"), register);
export default route