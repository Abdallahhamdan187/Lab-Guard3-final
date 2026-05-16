import jwt from "jsonwebtoken";
import { Server } from "socket.io";

const userRooms = (userId) => `user:${userId}`;
const ADMIN_ROOM = "admins";
export const registerNotificationSocket = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });
    io.use((socket, next) => {

        try {

            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error("Unauthorized"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = {
                id: decoded.id,
                role: decoded.role,
                name: decoded.name
            };

            next();

        } catch (err) {

            next(new Error("Authentication failed"));

        }
    });

    io.on("connection", async (socket) => {

        const userId = socket.user.id;

        console.log(`Socket connected: ${socket.id}`);
        console.log(`Authenticated user: ${userId}`);

        socket.join(userRooms(userId));
        if (socket.user.role === "admin") {
            socket.join(ADMIN_ROOM);
            console.log("Admin joined admin room");
        }
        socket.on("disconnect", (reason) => {

            console.log(
                `User ${userId} disconnected (${reason})`
            );

        });
    });

    return io;
};