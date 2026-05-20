import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cron from "node-cron"
const app = express();

app.use(express.json());
app.use(cors());


import authRoutes from "./router/auth.js";
import dashboardRoutes from "./router/dashboard.js";
import equipmentRoutes from "./router/equipment.js"
import transactionsRoute from "./router/transactions.js"
import usersRoute from "./router/users.js"
import logsRoute from "./router/logs.js"
import locationsRoute from "./router/locations.js";
import categoriesRoute from "./router/categories.js";
import {authMiddleware} from "./middleware/auth.js";
import http from "http";
import {registerNotificationSocket} from "./socket.io/notifications.js";
import {processDueDateNotifications, sendNotification} from "./utils/notifications.js";
import {CheckPasswordChange} from "./middleware/checkPasswordChange.js";

const TEST_USER_ID = 1;
const server = http.createServer(app);


const io = registerNotificationSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use("/api/auth", authRoutes);

app.use("/api",authMiddleware,CheckPasswordChange)

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/equipment",equipmentRoutes)

app.use("/api/transactions",transactionsRoute)

app.use("/api/users",usersRoute)

app.use("/api/logs",logsRoute)

app.use("/api/locations",locationsRoute)

app.use("/api/categories",categoriesRoute)


cron.schedule("0 * * * *", async () => {
    await processDueDateNotifications(io);
});

server.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});