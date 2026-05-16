import {db} from "../db/connection.js";
import {parseLimit} from "../utils/queryHelpers.js";
import bcrypt from "bcrypt";


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
                student_id
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                name,
                email,
                hashedPassword,
                role,
                department,
                student_id
            ]
        );

        res.json({
            message: "User created"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};