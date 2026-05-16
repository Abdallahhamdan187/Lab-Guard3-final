import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {db} from "../db/connection.js";
import {log} from "../utils/logger.js";
import {LOG_ACTIONS} from "../constants/logActions.js";

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const emailNormalized = email.toLowerCase().trim();
        const {rows} = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [emailNormalized]
        );

        const user = rows[0];

        if (!user) {
            log(LOG_ACTIONS.LOGIN_FAILED_NO_USER)
            return res.status(401).json({ error: "Wrong email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            log(LOG_ACTIONS.LOGIN_FAILED_WRONG_PASSWORD)
            return res.status(401).json({ error: "Wrong email or password" });
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        log(LOG_ACTIONS.LOGIN_SUCCESS,user.id)
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                imageUrl: user.imageUrl
            }
        });
    } catch (err) {
        console.log(err)
        log(LOG_ACTIONS.LOGIN_FAILED_SERVER_ERROR)
        res.status(500).json({ error: err.message });
    }
};