import {db} from "../db/connection.js";
import {
    getEquipmentByCategoryData,
    getEquipmentByStatusData,
    getEquipmentHealthData,
    getEquipmentUtilizationRateData,
    getMostBorrowedEquipmentData,
    getPeakRequestHoursData,
    getRequestStatusData, getUserDistributionData,
    getWeeklyRequestActivityData,
    getWeeklyRequestApprovalActivityData
} from "../services/analytics.js";

export const getStudentDashboardData = async (req, res) => {
    try {

        const { rows: activeRows } = await db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE type = 'borrow'
            AND status = 'Approved'
            AND return_date IS NULL
        `);

        const active = activeRows[0];

        const { rows: pendingRows } = await db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Pending'
        `);

        const pending = pendingRows[0];

        const { rows: returnedRows } = await db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Completed'
        `);

        const returned = returnedRows[0];

        const { rows: equipmentRows } = await db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
            WHERE available_quantity > 0
        `);

        const equipment = equipmentRows[0];

        const weeklyActivity = await getWeeklyRequestActivityData();

        const equipmentByCategory = await getEquipmentByCategoryData();

        res.json({
            activeBorrows: Number(active.count),
            pendingRequests: Number(pending.count),
            completedReturns: Number(returned.count),
            availableEquipment: Number(equipment.count),
            weeklyActivity,
            equipmentByCategory
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getLabAssistantDashboardData = async (req, res) => {
    try {

        const { rows: statsRows } = await db.query(`
            SELECT
                COUNT(*) AS total_equipment,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available,
                SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance,
                SUM(CASE WHEN status = 'In Use' THEN 1 ELSE 0 END) AS in_use
            FROM equipment
        `);

        const stats = statsRows[0];

        const { rows: labs } = await db.query(`
            SELECT 
                l.lab_name AS name,
                COUNT(e.id) AS equipment_count
            FROM locations l
            LEFT JOIN equipment e 
                ON e.location_id = l.id 
                AND e.available_quantity > 0
            GROUP BY l.lab_name
        `);

        res.json({
            totalEquipment: Number(stats.total_equipment),
            available: Number(stats.available),
            maintenance: Number(stats.maintenance),
            inUse: Number(stats.in_use),
            labs: labs.map(lab => ({
                ...lab,
                equipment_count: Number(lab.equipment_count)
            }))
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getInstructorDashboardData = async (req, res) => {
    try {

        const { rows: studentRows } = await db.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE role = 'student'
        `);

        const students = studentRows[0];

        const { rows: approvedRows } = await db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Approved'
            AND approval_date::date = CURRENT_DATE
        `);

        const approvedToday = approvedRows[0];

        const weeklyData = await getWeeklyRequestApprovalActivityData();

        const peakRequestHours = await getPeakRequestHoursData();

        const equipmentUsage = await getMostBorrowedEquipmentData();

        const equipmentStatus = await getEquipmentByStatusData();

        res.json({
            totalStudents: Number(students.count),
            approvedToday: Number(approvedToday.count),
            weeklyData,
            peakRequestHours,
            equipmentUsage,
            equipmentStatus,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAdminDashboardData = async (req, res) => {
    try {

        const [
            usersResult,
            equipmentResult,
            transactionsResult
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS count FROM users"),
            db.query("SELECT COUNT(*) AS count FROM equipment"),
            db.query("SELECT COUNT(*) AS count FROM transactions")
        ]);

        const users = usersResult.rows[0];
        const equipment = equipmentResult.rows[0];
        const transactions = transactionsResult.rows[0];

        const [
            usersGrowthResult,
            transactionsGrowthResult,
            approvedTransactionsGrowthResult
        ] = await Promise.all([

            db.query(`
                SELECT
                    TO_CHAR(created_at, 'Mon') AS month,
                    COUNT(*) AS count
                FROM users
                WHERE role = 'Student'
                AND created_at > NOW() - INTERVAL '6 months'
                GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
                ORDER BY EXTRACT(MONTH FROM created_at)
            `),

            db.query(`
                SELECT
                    TO_CHAR(request_date, 'Mon') AS month,
                    COUNT(*) AS count
                FROM transactions
                WHERE request_date > NOW() - INTERVAL '6 months'
                GROUP BY EXTRACT(MONTH FROM request_date), TO_CHAR(request_date, 'Mon')
                ORDER BY EXTRACT(MONTH FROM request_date)
            `),

            db.query(`
                SELECT
                    TO_CHAR(approval_date, 'Mon') AS month,
                    COUNT(*) AS count
                FROM transactions
                WHERE approval_date > NOW() - INTERVAL '6 months'
                AND status = 'Approved'
                GROUP BY EXTRACT(MONTH FROM approval_date), TO_CHAR(approval_date, 'Mon')
                ORDER BY EXTRACT(MONTH FROM approval_date)
            `)
        ]);

        const usersGrowth = usersGrowthResult.rows;
        const transactionsGrowth = transactionsGrowthResult.rows;
        const approvedTransactionsGrowth = approvedTransactionsGrowthResult.rows;

        const systemGrowth = {};

        const now = new Date();

        for (let i = 5; i >= 0; i--) {

            const d = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            const monthName = d.toLocaleString('en-US', {
                month: 'short'
            });

            systemGrowth[monthName] = {
                month: monthName,
                students: 0,
                transactions: 0,
                approved: 0
            };
        }

        usersGrowth.forEach((value) => {
            systemGrowth[value.month].students = Number(value.count);
        });

        approvedTransactionsGrowth.forEach((value) => {
            systemGrowth[value.month].approved = Number(value.count);
        });

        transactionsGrowth.forEach((value) => {
            systemGrowth[value.month].transactions = Number(value.count);
        });

        const statusData = await getEquipmentByStatusData();

        const borrowData = await getMostBorrowedEquipmentData();

        const categoryData = await getEquipmentByCategoryData();

        const utilizationData = await getEquipmentUtilizationRateData();

        const userDistribution = await getUserDistributionData();

        const requestStatus = await getRequestStatusData();

        const equipmentHealth = await getEquipmentHealthData();

        res.json({
            totalUsers: Number(users.count),
            totalEquipment: Number(equipment.count),
            totalTransactions: Number(transactions.count),
            systemGrowth: Object.values(systemGrowth),
            statusData,
            borrowData,
            categoryData,
            utilizationData,
            userDistribution,
            requestStatus,
            equipmentHealth,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/*
export const getWeeklyRequestActivity = async (req, res) => {
    try {
        const result = await getWeeklyRequestActivityData()
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getEquipmentByStatus = async (req,res)=>{
    try{
        const result = await getEquipmentByStatusData();
        res.json(result)
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const getMostBorrowedEquipment = async (req,res)=>{
    try{
        const result = await getMostBorrowedEquipmentData()
        res.json(result)
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}


export const getEquipmentByCategory = async (req, res) => {
    try {
        const result = await getEquipmentByCategoryData()
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getEquipmentUtilizationRate = async (req,res) =>{
    try{
        const result = await getEquipmentUtilizationRateData()
        res.json(result)
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const getUserDistribution = async (req, res) => {
    try {
        const result = await getUserDistributionData()
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export const getRequestStatus = async (req, res) => {
    try {
        const result = await getRequestStatusData()
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export const getEquipmentHealth = async (req, res) => {
    try {
        const result = await getEquipmentHealthData()
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


export const getPeakRequestHours = async (req,res) => {
    try{
        const result = await getPeakRequestHoursData()
        res.json(result)
    }catch (err) {
        res.status(500).json({error: err.message})
    }
}

export const getWeeklyRequestApprovalActivity = async (req, res) => {
    try{
        const results = await getWeeklyRequestApprovalActivityData()
        res.json(results)
    }catch (err) {
        res.status(500).json({error: err.message})
    }
}
*/