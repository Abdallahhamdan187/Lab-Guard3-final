import {db} from "../db/connection.js";
import {parseLimit} from "../utils/queryHelpers.js";

export const getMyNotifications = async (req, res) => {

    const { limit } = req.query;

    try {

        const limitValue = parseLimit(limit);

        const params = [req.user.id];

        let query = `
            SELECT *
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;

        if (limitValue !== null) {

            params.push(limitValue);

            query += ` LIMIT $${params.length}`;

        }

        const { rows } = await db.query(
            query,
            params
        );

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};

export const markNotificationRead = async (req, res) => {

    const { id } = req.params;

    const userId = req.user.id;

    try {

        const result = await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = $1
            AND user_id = $2
            `,
            [id, userId]
        );

        if (result.rowCount === 0) {

            return res.status(404).json({
                error: "Notification not found"
            });

        }

        res.json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};

export const markAllNotificationsRead = async (req, res) => {

    try {

        await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = $1
            `,
            [req.user.id]
        );

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};