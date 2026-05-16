import {db} from "../db/connection.js";


export const getLocations = async (req, res) => {
    try {

        const { rows } = await db.query(
            "SELECT * FROM locations"
        );

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};