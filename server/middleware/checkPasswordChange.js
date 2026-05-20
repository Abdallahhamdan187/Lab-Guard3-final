import {db} from "../db/connection.js";

export const CheckPasswordChange = async (req, res, next) => {
    const user = await db.query("SELECT must_change_password FROM users WHERE id=$1",[req.user.id]);
    if (user.must_change_password && req.path !== "/users/me/change-password") {
        return res.status(403).json({
            error: "You must change your password before continuing."
        });
    }
    next();
};