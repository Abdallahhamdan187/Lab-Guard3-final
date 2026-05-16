import {db} from "../db/connection.js";
import {parseLimit} from "../utils/queryHelpers.js";
import {LogMessageMap} from "../constants/logActions.js";

export const getLogs = async (req, res) => {

    const { limit } = req.query;

    let query = `
        SELECT
            l.*,
            u.name AS user
        FROM system_logs AS l
        LEFT JOIN users AS u
            ON l.user_id = u.id
        ORDER BY timestamp DESC
    `;

    const limitValue = parseLimit(limit);

    const params = [];

    if (limitValue !== null) {

        params.push(limitValue);

        query += ` LIMIT $${params.length}`;
    }

    try {

        const { rows } = await db.query(
            query,
            params
        );

        const newRows = rows.map(log => ({
            ...log,
            message: LogMessageMap[log.action] || log.action
        }));

        res.json(newRows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};