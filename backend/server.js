const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
port: Number(process.env.DB_PORT || 5432),
database: process.env.DB_NAME,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
ssl: { rejectUnauthorized: false }
});

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "Blood Bank Management System API is running"
    });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "PostgreSQL connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// ==================== DONOR APIs ====================

// Get all donors
app.get("/api/donors", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                donor_id,
                name,
                age,
                gender,
                blood_group_code,
                phone,
                email,
                address,
                last_donation_date,
                eligibility_status
            FROM DONOR
            ORDER BY donor_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch donors",
            error: error.message
        });
    }
});

// Get one donor by ID
app.get("/api/donors/:id", async (req, res) => {
    try {
        const donorId = parseInt(req.params.id);

        const result = await pool.query(
            `
            SELECT 
                donor_id,
                name,
                age,
                gender,
                blood_group_code,
                phone,
                email,
                address,
                last_donation_date,
                eligibility_status
            FROM DONOR
            WHERE donor_id = $1
            `,
            [donorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Donor not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch donor",
            error: error.message
        });
    }
});

// Add donor
app.post("/api/donors", async (req, res) => {
    console.log("DONOR REGISTRATION:", req.body);
    const client = await pool.connect();

    try {
        const {
            donor_id,
            name,
            age,
            gender,
            blood_group_code,
            phone,
            email,
            address,
            last_donation_date,
            eligibility_status,
            camp_id,
            donation_date,
            units_donated
        } = req.body;

        const isDonated = eligibility_status === "Donated";

        if (
            !donor_id ||
            !name ||
            !age ||
            !gender ||
            !blood_group_code ||
            !phone ||
            !eligibility_status
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required donor details."
            });
        }

        if (
            isDonated &&
            (
                !camp_id ||
                !donation_date ||
                !Number.isInteger(Number(units_donated)) ||
                Number(units_donated) < 1
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Donation camp, date, and valid units are required."
            });
        }

        await client.query("BEGIN");

        const donorResult = await client.query(
            `INSERT INTO DONOR (
                donor_id,
                name,
                age,
                gender,
                blood_group_code,
                phone,
                email,
                address,
                last_donation_date,
                eligibility_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`,
            [
                donor_id,
                name,
                age,
                gender,
                blood_group_code,
                phone,
                email || null,
                address || null,
                isDonated ? donation_date : (last_donation_date || null),
                eligibility_status
            ]
        );

        let donation = null;

        if (isDonated) {
            const campCheck = await client.query(
                `SELECT camp_id
                 FROM DONATION_CAMP
                 WHERE camp_id = $1`,
                [Number(camp_id)]
            );

            if (campCheck.rows.length === 0) {
                throw new Error("Selected donation camp does not exist.");
            }

            const donationResult = await client.query(
                `INSERT INTO DONATION_RECORD (
                    donor_id,
                    camp_id,
                    units_donated,
                    donation_date,
                    status
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [
                    donor_id,
                    Number(camp_id),
                    Number(units_donated),
                    donation_date,
                    "Completed"
                ]
            );

            donation = donationResult.rows[0];
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: isDonated
                ? "Donor registered and donation history recorded successfully."
                : "Donor added successfully.",
            donor: donorResult.rows[0],
            donation
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Add donor error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add donor.",
            error: error.message
        });

    } finally {
        client.release();
    }
});

// Update donor
app.put("/api/donors/:id", async (req, res) => {
    try {
        const donorId = parseInt(req.params.id);

        const {
            name,
            age,
            gender,
            blood_group_code,
            phone,
            email,
            address,
            last_donation_date,
            eligibility_status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE DONOR
            SET
                name = $1,
                age = $2,
                gender = $3,
                blood_group_code = $4,
                phone = $5,
                email = $6,
                address = $7,
                last_donation_date = $8,
                eligibility_status = $9
            WHERE donor_id = $10
            RETURNING *
            `,
            [
                name,
                age,
                gender,
                blood_group_code,
                phone,
                email,
                address,
                last_donation_date,
                eligibility_status,
                donorId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Donor not found"
            });
        }

        res.json({
            success: true,
            message: "Donor updated successfully",
            donor: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update donor",
            error: error.message
        });
    }
});

// Delete donor
app.delete("/api/donors/:id", async (req, res) => {
    try {
        const donorId = parseInt(req.params.id);

        const result = await pool.query(
            `
            DELETE FROM DONOR
            WHERE donor_id = $1
            RETURNING *
            `,
            [donorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Donor not found"
            });
        }

        res.json({
            success: true,
            message: "Donor deleted successfully"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete donor",
            error: error.message
        });
    }
});
// ==================== BLOOD STOCK APIs ====================

// Get all blood stock

// Get all blood stock with hospital details
app.get("/api/blood-stock", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                bs.stock_id,
                bs.hospital_id,
                h.name,
                bs.blood_group_code,
                bs.units_available,
                bs.target_capacity,
                bs.last_updated
            FROM BLOOD_STOCK bs
            JOIN HOSPITAL h
                ON bs.hospital_id = h.hospital_id
            ORDER BY bs.stock_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch blood stock",
            error: error.message
        });
    }
});
app.post("/api/blood-stock", async (req, res) => {
    try {
        const {
            hospital_id,
            blood_group_code,
            units_available,
            target_capacity
        } = req.body;

        const hospitalId = Number(hospital_id);
        const units = Number(units_available);
        const capacity = Number(target_capacity);

        const validGroups = [
            "A+", "A-", "B+", "B-",
            "AB+", "AB-", "O+", "O-"
        ];

        if (
            !Number.isInteger(hospitalId) ||
            hospitalId <= 0 ||
            !validGroups.includes(blood_group_code) ||
            !Number.isInteger(units) ||
            units < 0 ||
            !Number.isInteger(capacity) ||
            capacity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid hospital, blood group, units, and capacity."
            });
        }

        const hospital = await pool.query(
            "SELECT hospital_id FROM HOSPITAL WHERE hospital_id = $1",
            [hospitalId]
        );

        if (hospital.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected hospital does not exist."
            });
        }

        const existing = await pool.query(
            `SELECT stock_id
             FROM BLOOD_STOCK
             WHERE hospital_id = $1 AND blood_group_code = $2`,
            [hospitalId, blood_group_code]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This hospital already has a stock record for that blood group. Use Update Stock instead."
            });
        }

        const result = await pool.query(
            `INSERT INTO BLOOD_STOCK
                (hospital_id, blood_group_code, units_available,
                 target_capacity, last_updated)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [hospitalId, blood_group_code, units, capacity]
        );

        res.status(201).json({
            success: true,
            message: "Blood stock added successfully.",
            stock: result.rows[0]
        });
    } catch (error) {
        console.error("Add blood stock error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add blood stock.",
            error: error.message
        });
    }
});

// Update blood stock
app.put("/api/blood-stock/:id", async (req, res) => {
    try {
        const stockId = parseInt(req.params.id);
        const { units_available, target_capacity } = req.body;

        if (
            !Number.isInteger(stockId) ||
            !Number.isInteger(Number(units_available)) ||
            !Number.isInteger(Number(target_capacity))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock values"
            });
        }

        if (Number(units_available) < 0 || Number(target_capacity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Units cannot be negative and target must be greater than 0"
            });
        }

        const result = await pool.query(
            `
            UPDATE BLOOD_STOCK
            SET
                units_available = $1,
                target_capacity = $2,
                last_updated = CURRENT_TIMESTAMP
            WHERE stock_id = $3
            RETURNING *
            `,
            [
                Number(units_available),
                Number(target_capacity),
                stockId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood stock record not found"
            });
        }

        res.json({
            success: true,
            message: "Blood stock updated successfully",
            stock: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update blood stock",
            error: error.message
        });
    }
});
// Get all recipients
app.get("/api/recipients", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.recipient_id,
                r.name,
                r.age,
                r.gender,
                r.blood_group_needed,
                r.hospital_id,
                r.attending_doctor_id,
                r.date_registered,
                latest.units_needed
            FROM RECIPIENT r
            LEFT JOIN LATERAL (
                SELECT br.units_needed
                FROM BLOOD_REQUEST br
                WHERE br.recipient_id = r.recipient_id
                ORDER BY br.request_date DESC, br.request_id DESC
                LIMIT 1
            ) latest ON TRUE
            ORDER BY r.recipient_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching recipients:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recipients"
        });
    }
});

// Add a recipient
app.post("/api/recipients", async (req, res) => {
    try {
        const {
            name, age, gender, blood_group_needed,
            hospital_id, attending_doctor_id, date_registered
        } = req.body;

        const missingFields = [];

if (!name) missingFields.push("name");
if (!age) missingFields.push("age");
if (!gender) missingFields.push("gender");
if (!blood_group_needed) missingFields.push("blood_group_needed");
if (!hospital_id) missingFields.push("hospital_id");
if (!attending_doctor_id) missingFields.push("attending_doctor_id");
if (!date_registered) missingFields.push("date_registered");

if (missingFields.length > 0) {
    return res.status(400).json({
        success: false,
        message: "Missing required fields: " + missingFields.join(", ")
    });
}

        const result = await pool.query(`
            INSERT INTO RECIPIENT
                (name, age, gender, blood_group_needed, hospital_id,
                 attending_doctor_id, date_registered)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            name, age, gender, blood_group_needed,
            hospital_id, attending_doctor_id, date_registered
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding recipient:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add recipient"
        });
    }
});

// Update a recipient
app.put("/api/recipients/:id", async (req, res) => {
    try {
        const {
            name, age, gender, blood_group_needed,
            hospital_id, attending_doctor_id, date_registered
        } = req.body;

        const result = await pool.query(`
            UPDATE RECIPIENT
            SET name = $1,
                age = $2,
                gender = $3,
                blood_group_needed = $4,
                hospital_id = $5,
                attending_doctor_id = $6,
                date_registered = $7
            WHERE recipient_id = $8
            RETURNING *
        `, [
            name, age, gender, blood_group_needed,
            hospital_id, attending_doctor_id, date_registered,
            req.params.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating recipient:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update recipient"
        });
    }
});

// Delete a recipient
app.delete("/api/recipients/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM RECIPIENT WHERE recipient_id = $1 RETURNING recipient_id",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found"
            });
        }

        res.json({
            success: true,
            message: "Recipient deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting recipient:", error);
        res.status(500).json({
            success: false,
            message: "Could not delete recipient. It may be linked to other records."
        });
    }
});
// Get hospitals and staff for recipient registration
app.get("/api/recipient-form-options", async (req, res) => {
    try {
        const hospitals = await pool.query(`
            SELECT hospital_id, name
            FROM HOSPITAL
            ORDER BY name
        `);

        const doctors = await pool.query(`
            SELECT staff_id, name
            FROM STAFF
            ORDER BY name
        `);

        res.json({
            hospitals: hospitals.rows,
            doctors: doctors.rows
        });
    } catch (error) {
        console.error("Error loading recipient form options:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load hospitals and doctors"
        });
    }
});
app.get("/api/dashboard-stats", async (req, res) => {
    try {
        const [
            donors,
            recipients,
            stock,
            hospitals,
            requests
        ] = await Promise.all([
            pool.query(
                "SELECT COUNT(*)::int AS total FROM DONOR"
            ),
            pool.query(
                "SELECT COUNT(*)::int AS total FROM RECIPIENT"
            ),
            pool.query(`
                SELECT COALESCE(SUM(units_available), 0)::int AS total
                FROM BLOOD_STOCK
            `),
            pool.query(
                "SELECT COUNT(*)::int AS total FROM HOSPITAL"
            ),
            pool.query(`
                SELECT
                    COUNT(*) FILTER (
                        WHERE status = 'Pending'
                    )::int AS pending,
                    COUNT(*) FILTER (
                        WHERE status = 'Approved'
                    )::int AS approved
                FROM BLOOD_REQUEST
            `)
        ]);

        res.json({
            totalDonors: donors.rows[0].total,
            totalRecipients: recipients.rows[0].total,
            totalUnits: stock.rows[0].total,
            totalHospitals: hospitals.rows[0].total,
            pendingRequests: requests.rows[0].pending,
            approvedRequests: requests.rows[0].approved
        });

    } catch (error) {
        console.error("Dashboard statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics"
        });
    }
});

        
app.get("/api/dashboard-stats", async (req, res) => {
    try {
        const [
            donors,
            recipients,
            stock,
            hospitals,
            requests
        ] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS total FROM DONOR"),
            pool.query("SELECT COUNT(*)::int AS total FROM RECIPIENT"),
            pool.query(`
                SELECT COALESCE(SUM(units_available), 0)::int AS total
                FROM BLOOD_STOCK
            `),
            pool.query("SELECT COUNT(*)::int AS total FROM HOSPITAL"),
            pool.query(`
                SELECT
                    COUNT(*) FILTER (
                        WHERE status = 'Pending'
                    )::int AS pending,
                    COUNT(*) FILTER (
                        WHERE status = 'Approved'
                    )::int AS approved
                FROM BLOOD_REQUEST
            `)
        ]);

        res.json({
            totalDonors: donors.rows[0].total,
            totalRecipients: recipients.rows[0].total,
            totalUnits: stock.rows[0].total,
            totalHospitals: hospitals.rows[0].total,
            pendingRequests: requests.rows[0].pending,
            approvedRequests: requests.rows[0].approved
        });

    } catch (error) {
        console.error("Dashboard statistics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics"
        });
    }
});
app.get("/api/latest-blood-requests", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                br.request_id,
                br.blood_group_code,
                br.units_needed,
                br.priority,
                br.request_date,
                br.status,
                r.name AS recipient_name,
                h.name AS hospital_name
            FROM BLOOD_REQUEST br
            JOIN RECIPIENT r
                ON br.recipient_id = r.recipient_id
            JOIN HOSPITAL h
                ON br.hospital_id = h.hospital_id
            ORDER BY br.request_date DESC, br.request_id DESC
            LIMIT 5
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Latest blood requests error:", error);
        res.status(500).json({
            message: "Failed to load latest blood requests"
        });
    }
});
app.get("/api/requests", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                br.request_id,
                br.recipient_id,
                br.hospital_id,
                br.blood_group_code,
                br.units_needed,
                br.priority,
                br.request_date,
                br.status,
                br.processed_by_staff_id,
                r.name AS recipient_name,
                h.name AS hospital_name
            FROM BLOOD_REQUEST br
            JOIN RECIPIENT r
                ON br.recipient_id = r.recipient_id
            JOIN HOSPITAL h
                ON br.hospital_id = h.hospital_id
            ORDER BY br.request_date DESC, br.request_id DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch blood requests error:", error);
        res.status(500).json({
            message: "Failed to fetch blood requests"
        });
    }
});
app.post("/api/requests", async (req, res) => {
    try {
        const {
            recipient_id,
            hospital_id,
            blood_group_code,
            units_needed,
            priority
        } = req.body;

        if (
            !recipient_id ||
            !hospital_id ||
            !blood_group_code ||
            !Number.isInteger(Number(units_needed)) ||
            Number(units_needed) < 1 ||
            !priority
        ) {
            return res.status(400).json({
                message: "Please provide valid details for all request fields."
            });
        }

        const validPriorities = [
            "Emergency",
            "High Priority",
            "Normal / Elective"
        ];

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid request priority."
            });
        }

        const recipientCheck = await pool.query(
            "SELECT recipient_id FROM RECIPIENT WHERE recipient_id = $1",
            [recipient_id]
        );

        if (recipientCheck.rows.length === 0) {
            return res.status(400).json({
                message: "Selected recipient does not exist."
            });
        }

        const hospitalCheck = await pool.query(
            "SELECT hospital_id FROM HOSPITAL WHERE hospital_id = $1",
            [hospital_id]
        );

        if (hospitalCheck.rows.length === 0) {
            return res.status(400).json({
                message: "Selected hospital does not exist."
            });
        }

        const result = await pool.query(
            `INSERT INTO BLOOD_REQUEST
                (recipient_id, hospital_id, blood_group_code,
                 units_needed, priority, request_date, status)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'Pending')
             RETURNING *`,
            [
                recipient_id,
                hospital_id,
                blood_group_code,
                Number(units_needed),
                priority
            ]
        );

        res.status(201).json({
            message: "Blood request created successfully.",
            request: result.rows[0]
        });
    } catch (error) {
        console.error("Create blood request error:", error);

        res.status(500).json({
            message: "Failed to create blood request."
        });
    }
});
app.put("/api/requests/:id/status", async (req, res) => {
    try {
        const requestId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                message: "Invalid request ID"
            });
        }

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Approved or Rejected"
            });
        }

        const result = await pool.query(
            `UPDATE BLOOD_REQUEST
             SET status = $1
             WHERE request_id = $2
             RETURNING request_id, status`,
            [status, requestId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Blood request not found"
            });
        }

        res.json({
            message: `Request ${status.toLowerCase()} successfully`,
            request: result.rows[0]
        });
    } catch (error) {
        console.error("Update blood request error:", error);
        res.status(500).json({
            message: "Failed to update blood request"
        });
    }
});
app.get("/api/donations", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                dr.donation_id,
                d.name AS donor_name,
                d.blood_group_code,
                dr.units_donated,
                dr.donation_date,
                dc.name AS camp_name,
                dr.status
            FROM DONATION_RECORD dr
            JOIN DONOR d
                ON dr.donor_id = d.donor_id
            JOIN DONATION_CAMP dc
                ON dr.camp_id = dc.camp_id
            ORDER BY dr.donation_date DESC, dr.donation_id DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch donation history error:", error);

        res.status(500).json({
            message: "Failed to fetch donation history"
        });
    }
});
app.get("/api/hospitals", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                hospital_id,
                name,
                address,
                phone,
                email,
                total_beds,
                available_beds,
                status,
                emergency_support
            FROM HOSPITAL
            ORDER BY hospital_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch hospitals error:", error);

        res.status(500).json({
            message: "Failed to fetch hospitals"
        });
    }
});
/* Add a hospital */
app.post("/api/hospitals", async (req, res) => {
    try {
        const { name, address, phone, total_beds } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                message: "Hospital name and phone are required."
            });
        }

        const beds = Number(total_beds);

        if (!Number.isInteger(beds) || beds < 0) {
            return res.status(400).json({
                message: "Enter a valid number of beds."
            });
        }

        const result = await pool.query(
            `INSERT INTO HOSPITAL (
                hospital_id,
                name,
                address,
                phone,
                email,
                total_beds,
                available_beds,
                status,
                emergency_support
            )
            SELECT
                COALESCE(MAX(hospital_id), 0) + 1,
                $1, $2, $3, $4, $5, $6, $7, $8
            FROM HOSPITAL
            RETURNING *`,
            [
                name.trim(),
                address?.trim() || null,
                phone.trim(),
                null,
                beds,
                Math.round(beds * 0.3),
                "Active Partner",
                true
            ]
        );

        res.status(201).json({
            message: "Hospital added successfully.",
            hospital: result.rows[0]
        });
    } catch (error) {
        console.error("Add hospital error:", error);

        res.status(500).json({
            message: "Failed to add hospital.",
            error: error.message
        });
    }
});

/* Delete a hospital */
app.delete("/api/hospitals/:id", async (req, res) => {
    try {
        const hospitalId = Number(req.params.id);

        if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
            return res.status(400).json({
                message: "Invalid hospital ID."
            });
        }

        const result = await pool.query(
            `DELETE FROM HOSPITAL
             WHERE hospital_id = $1
             RETURNING hospital_id, name`,
            [hospitalId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Hospital not found."
            });
        }

        res.json({
            message: "Hospital deleted successfully.",
            hospital: result.rows[0]
        });
    } catch (error) {
        console.error("Delete hospital error:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "This hospital is linked to other records and cannot be deleted."
            });
        }

        res.status(500).json({
            message: "Failed to delete hospital.",
            error: error.message
        });
    }
});
app.get("/api/reports/monthly", async (req, res) => {
    try {
        const result = await pool.query(`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
                    date_trunc('month', CURRENT_DATE),
                    INTERVAL '1 month'
                ) AS month_start
            )
            SELECT
                TO_CHAR(m.month_start, 'Mon') AS month,
                (
                    SELECT COUNT(*)
                    FROM DONATION_RECORD dr
                    WHERE dr.donation_date >= m.month_start
                      AND dr.donation_date < m.month_start + INTERVAL '1 month'
                )::int AS donations,
                (
                    SELECT COUNT(*)
                    FROM BLOOD_REQUEST br
                    WHERE br.request_date >= m.month_start
                      AND br.request_date < m.month_start + INTERVAL '1 month'
                )::int AS requests
            FROM months m
            ORDER BY m.month_start
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Monthly report error:", error);
        res.status(500).json({
            message: "Failed to fetch monthly report data."
        });
    }
});
app.get("/api/reports/urgency", async (req, res) => {
    try {
        const result = await pool.query(`
            WITH urgency_categories AS (
                SELECT *
                FROM (VALUES
                    ('Emergency', 1),
                    ('High Priority', 2),
                    ('Normal / Elective', 3)
                ) AS categories(urgency, sort_order)
            ),
            request_counts AS (
                SELECT
                    CASE
                        WHEN LOWER(COALESCE(priority, '')) LIKE '%emergency%'
                            THEN 'Emergency'
                        WHEN LOWER(COALESCE(priority, '')) LIKE '%high%'
                            THEN 'High Priority'
                        ELSE 'Normal / Elective'
                    END AS urgency,
                    COUNT(*)::int AS total
                FROM BLOOD_REQUEST
                GROUP BY 1
            )
            SELECT
                c.urgency,
                COALESCE(r.total, 0)::int AS total
            FROM urgency_categories c
            LEFT JOIN request_counts r ON r.urgency = c.urgency
            ORDER BY c.sort_order
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Urgency report error:", error);
        res.status(500).json({
            message: "Failed to fetch urgency report data."
        });
    }
});
app.get("/api/reports/hospital-dispatch", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                h.name AS hospital_name,
                COALESCE(SUM(
                    CASE
                        WHEN LOWER(br.status) = 'approved'
                        THEN br.units_needed
                        ELSE 0
                    END
                ), 0)::int AS units
            FROM HOSPITAL h
            LEFT JOIN BLOOD_REQUEST br
                ON h.hospital_id = br.hospital_id
            GROUP BY h.hospital_id, h.name
            ORDER BY units DESC, h.name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Hospital dispatch report error:", error);
        res.status(500).json({
            message: "Failed to fetch hospital report data."
        });
    }
});
app.get("/api/reports/donations-trend", async (req, res) => {
    try {
        const result = await pool.query(`
            WITH weeks AS (
                SELECT
                    generate_series(
                        date_trunc('week', CURRENT_DATE) - INTERVAL '3 weeks',
                        date_trunc('week', CURRENT_DATE),
                        INTERVAL '1 week'
                    ) AS week_start
            )
            SELECT
                'Week ' || ROW_NUMBER() OVER (ORDER BY w.week_start) AS week,
                COALESCE(SUM(
                    CASE
                        WHEN LOWER(COALESCE(dr.status, '')) = 'completed'
                        THEN dr.units_donated
                        ELSE 0
                    END
                ), 0)::int AS units
            FROM weeks w
            LEFT JOIN DONATION_RECORD dr
                ON dr.donation_date >= w.week_start
                AND dr.donation_date < w.week_start + INTERVAL '1 week'
            GROUP BY w.week_start
            ORDER BY w.week_start
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Donations trend report error:", error);
        res.status(500).json({
            message: "Failed to fetch donations trend data."
        });
    }
});
// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});