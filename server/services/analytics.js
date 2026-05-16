import {db} from "../db/connection.js";

export const getEquipmentByStatusData = async () => {
    const { rows } = await db.query(`
        SELECT 
            status,
            COUNT(*) AS value,
            ROUND(
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipment),
                2
            ) AS percentage
        FROM equipment
        GROUP BY status
        ORDER BY CASE status
            WHEN 'Available' THEN 1
            WHEN 'In Use' THEN 2
            WHEN 'Maintenance' THEN 3
            WHEN 'Reserved' THEN 4
        END
    `);

    return rows.map((value) => {
        let color = "#999";

        switch (value.status) {
            case "Available":
                color = "#27ae60";
                break;
            case "In Use":
                color = "#3498db";
                break;
            case "Maintenance":
                color = "#f39c12";
                break;
            case "Reserved":
                color = "#9b59b6";
                break;
        }

        return {
            ...value,
            color
        };
    });
};

export const getMostBorrowedEquipmentData = async () => {
    const { rows } = await db.query(`
        SELECT 
            e.name AS name,
            COUNT(t.id) AS borrows
        FROM equipment AS e
        LEFT JOIN transactions AS t
            ON t.equipment_id = e.id
        GROUP BY e.name
        ORDER BY COUNT(t.id) DESC
    `);

    return rows;
};

export const getEquipmentByCategoryData = async () => {
    const { rows } = await db.query(`
        SELECT 
            c.id,
            c.name AS category,
            COUNT(e.id) AS count
        FROM equipment e
        JOIN categories c ON e.category_id = c.id
        GROUP BY c.id, c.name
    `);

    const total = rows.reduce(
        (sum, r) => sum + Number(r.count),
        0
    );

    return rows.map((r) => ({
        id: r.id,
        name: r.category || "Uncategorized",
        value: Number(r.count),
        percentage: total
            ? Math.round((Number(r.count) / total) * 100)
            : 0
    }));
};

export const getEquipmentUtilizationRateData = async () => {
    const { rows } = await db.query(`
        SELECT 
            e.name,
            CASE 
                WHEN e.total_quantity = 0 THEN 0
                ELSE (e.total_quantity - e.available_quantity) * 100.0 / e.total_quantity
            END AS utilization
        FROM equipment e
    `);

    return rows;
};

export const getUserDistributionData = async () => {
    const { rows } = await db.query(`
        SELECT 
            role AS label,
            COUNT(*) AS value,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS percentage
        FROM users
        GROUP BY role
    `);

    return rows.map((value) => {
        let color = "#999";

        switch (value.label) {
            case "student":
                color = "#3498db";
                break;
            case "lab-assistant":
                color = "#27ae60";
                break;
            case "instructor":
                color = "#f39c12";
                break;
            case "admin":
                color = "#9b59b6";
                break;
        }

        return {
            ...value,
            label: `${value.label} (${value.percentage}%)`,
            color
        };
    });
};

export const getEquipmentHealthData = async () => {
    const { rows } = await db.query(`
        SELECT 
            status AS label,
            COUNT(*) AS value,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipment), 2) AS percentage
        FROM equipment
        GROUP BY status
    `);

    return rows.map((value) => {
        let label = value.label;
        let color = "#999";

        switch (value.label) {
            case "Available":
                label = "Operational";
                color = "#27ae60";
                break;
            case "In Use":
                label = "Avg. Utilization";
                color = "#3498db";
                break;
            case "Maintenance":
                color = "#e9333f";
                break;
        }

        return {
            ...value,
            label,
            color
        };
    });
};

export const getRequestStatusData = async () => {
    const { rows } = await db.query(`
        SELECT 
            status AS label,
            COUNT(*) AS value,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) AS percentage
        FROM transactions
        GROUP BY status
    `);

    return rows.map((value) => {
        let color = "#999";

        switch (value.label) {
            case "Pending":
                color = "#f39c12";
                break;
            case "Approved":
                color = "#27ae60";
                break;
            case "Completed":
                color = "#3498db";
                break;
        }

        return {
            ...value,
            color
        };
    });
};

export const getPeakRequestHoursData = async () => {
    const { rows } = await db.query(`
        SELECT 
            EXTRACT(HOUR FROM request_date) AS hour,
            COUNT(*) AS requests
        FROM transactions
        GROUP BY EXTRACT(HOUR FROM request_date)
        ORDER BY requests DESC
    `);

    return rows;
};

export const getWeeklyRequestActivityData = async () => {
    const { rows } = await db.query(`
        SELECT 
            TO_CHAR(request_date, 'Dy') AS day,
            SUM(CASE WHEN type = 'Borrow' THEN 1 ELSE 0 END) AS borrows,
            SUM(CASE WHEN type = 'Return' THEN 1 ELSE 0 END) AS returns
        FROM transactions
        WHERE request_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(request_date), TO_CHAR(request_date, 'Dy')
        ORDER BY DATE(request_date)
    `);

    return rows;
};

export const getWeeklyRequestApprovalActivityData = async () => {
    const { rows } = await db.query(`
        SELECT 
            TO_CHAR(request_date, 'Dy') AS day,
            COUNT(*) AS requests,
            COUNT(*) FILTER (WHERE status = 'Approved') AS approvals,
            COUNT(*) FILTER (WHERE status = 'Denied') AS denials
        FROM transactions
        WHERE request_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(request_date), TO_CHAR(request_date, 'Dy')
        ORDER BY DATE(request_date)
    `);

    return rows;
};