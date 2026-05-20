import {db} from "../db/connection.js";
import {parseLimit} from "../utils/queryHelpers.js";
import bcrypt from "bcrypt";
import {LOG_ACTIONS} from "../constants/logActions.js";
import {log} from "../utils/logger.js";


export const getUsers = async (req, res) => {

    const { limit } = req.query;

    let query = `
        SELECT id, name, department, role, created_at
        FROM users
        ORDER BY created_at DESC
    `;

    const params = [];

    const limitValue = parseLimit(limit);

    if (limitValue !== null) {
        params.push(limitValue);
        query += ` LIMIT $${params.length}`;
    }

    try {

        const { rows } = await db.query(query, params);

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};

export const register = async (req, res) => {
    try {

        let { name, email, password, role, department, student_id } = req.body;

        const allowedRoles = ["student", "lab-assistant", "instructor", "admin"];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid Role"
            });
        }

        if (!name || !email || !password || !role || !department) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        email = email.trim().toLowerCase();

        if (student_id?.trim() === "") {
            student_id = null;
        }

        if (role === "student") {

            if (!student_id) {
                return res.status(400).json({
                    error: "Students must have a student ID"
                });
            }

            student_id = student_id.trim();

            // Must contain exactly 8 digits
            if (!/^\d{8}$/.test(student_id)) {
                return res.status(400).json({
                    error: "Student ID must be an 8-digit integer"
                });
            }

            const { rows: studentRows } = await db.query(
                "SELECT id FROM users WHERE student_id = $1",
                [student_id]
            );

            if (studentRows.length > 0) {
                return res.status(400).json({
                    error: "User with this student ID already exists"
                });
            }

        } else {
            student_id = null;
        }

        const { rows: emailRows } = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (emailRows.length > 0) {
            return res.status(400).json({
                error: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
            INSERT INTO users (
                name,
                email,
                password,
                role,
                department,
                student_id,
                must_change_password
            )
            VALUES ($1, $2, $3, $4, $5, $6,TRUE)
            `,
            [
                name,
                email,
                hashedPassword,
                role,
                department,
                student_id,
            ]
        );
        log(req.io,LOG_ACTIONS.REGISTER_USER,req.user.id,{
            user: name
        })
        res.json({
            message: "User created"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};

export const changePassword = async (req,res) => {
    const userId = req.user.id
    const {currentPassword,newPassword,confirmPassword} = req.body
    try{
        if (!currentPassword){
            return res.status(400).json({error: "Missing Field: Current Password"})
        }
        if (!newPassword){
            return res.status(400).json({error: "Missing Field: New Password"})
        }
        if (!confirmPassword){
            return res.status(400).json({error: "Missing Field: Confirm Password"})
        }
        const {rows} = await db.query(
            "SELECT password FROM users WHERE id=$1",
            [userId]
        )
        const user = rows[0]
        if(!user){
            return res.status(404).json({error: "User not found"})
        }
        const isMatch = await bcrypt.compare(currentPassword,user.password)
        if (!isMatch){
            return res.status(400).json({error: "Current password is incorrect"})
        }
        if (newPassword !== confirmPassword){
            return res.status(400).json({error: "New password does not match confirm password"})
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({error: "New password must be different from current password"});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            "UPDATE users SET password=$1,must_change_password=FALSE WHERE id=$2",
            [hashedPassword,userId]
        )
        log(req.io,LOG_ACTIONS.CHANGE_PASSWORD,userId)
        res.json({ message: "Password changed successfully." });
    }catch (err) {
        res.status(500).json({error: err.message});
    }
}