
const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// FILE UPLOAD CONFIGURATION
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================================
// SUBMIT COMPLAINT - AUTHENTICATED CITIZEN
// =====================================================

router.post(
  "/submit",
  verifyToken,
  allowRoles("Citizen"),
  upload.single("supporting_file"),
  (req, res) => {
    const { category, description, location } = req.body;
    const userId = req.user.id;

    const supportingFile = req.file ? req.file.filename : null;

    if (!category || !description || !location) {
      return res.status(400).json({
        message: "All complaint fields are required",
      });
    }

    const complaintId =
      "GRV-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(10000 + Math.random() * 90000);

    const sql = `
      INSERT INTO complaints
      (
        complaint_id,
        user_id,
        category,
        description,
        location,
        supporting_file
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        complaintId,
        userId,
        category,
        description,
        location,
        supportingFile,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            message: "Complaint submission failed",
          });
        }

        const updateSql = `
          INSERT INTO complaint_updates
          (complaint_id, status, remarks, updated_by)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          updateSql,
          [
            result.insertId,
            "Submitted",
            "Complaint registered successfully.",
            userId,
          ],
          (updateErr) => {
            if (updateErr) {
              console.error(updateErr);
            }

            return res.status(201).json({
              message: "Complaint submitted successfully",
              complaintId,
            });
          }
        );
      }
    );
  }
);

// =====================================================
// MY COMPLAINTS - ONLY THE LOGGED-IN CITIZEN
// =====================================================

router.get(
  "/my-complaints/:userId",
  verifyToken,
  allowRoles("Citizen"),
  (req, res) => {
    const requestedUserId = Number(req.params.userId);

    if (requestedUserId !== Number(req.user.id)) {
      return res.status(403).json({
        message: "You can only view your own complaints.",
      });
    }

    const sql = `
      SELECT
        id,
        complaint_id,
        category,
        description,
        location,
        supporting_file,
        status,
        created_at,
        updated_at
      FROM complaints
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to fetch complaints",
        });
      }

      return res.json(results);
    });
  }
);

// =====================================================
// TRACK COMPLAINT
// Public tracking retained for the existing tracking page.
// =====================================================

router.get("/track/:complaintId", (req, res) => {
  const { complaintId } = req.params;

  const complaintSql = `
    SELECT
      id,
      complaint_id,
      category,
      description,
      location,
      supporting_file,
      status,
      created_at,
      updated_at
    FROM complaints
    WHERE complaint_id = ?
  `;

  db.query(complaintSql, [complaintId], (err, complaints) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch complaint",
      });
    }

    if (complaints.length === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    const complaint = complaints[0];

    const updatesSql = `
      SELECT status, remarks, created_at
      FROM complaint_updates
      WHERE complaint_id = ?
      ORDER BY created_at ASC
    `;

    db.query(updatesSql, [complaint.id], (updateErr, updates) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({
          message: "Failed to fetch complaint timeline",
        });
      }

      return res.json({
        complaint,
        updates,
      });
    });
  });
});

// =====================================================
// ALL COMPLAINTS - ADMIN / OFFICER ONLY
// =====================================================

router.get(
  "/all",
  verifyToken,
  allowRoles("Admin", "Officer"),
  (req, res) => {
    const sql = `
      SELECT
        c.id,
        c.complaint_id,
        c.category,
        c.description,
        c.location,
        c.supporting_file,
        c.status,
        c.created_at,
        u.name AS citizen_name,
        u.email AS citizen_email
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to fetch complaints",
        });
      }

      return res.json(results);
    });
  }
);

// =====================================================
// UPDATE STATUS - ADMIN / OFFICER ONLY
// =====================================================

router.put(
  "/update-status/:complaintId",
  verifyToken,
  allowRoles("Admin", "Officer"),
  (req, res) => {
    const { complaintId } = req.params;
    const { status, remarks } = req.body;
    const updatedBy = req.user.id;

    const allowedStatuses = [
      "Submitted",
      "Assigned",
      "In Progress",
      "Escalated",
      "Resolved",
      "Closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid complaint status",
      });
    }

    const findSql = `
      SELECT id
      FROM complaints
      WHERE complaint_id = ?
    `;

    db.query(findSql, [complaintId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to find complaint",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      const complaintDbId = results[0].id;

      const updateSql = `
        UPDATE complaints
        SET status = ?
        WHERE id = ?
      `;

      db.query(updateSql, [status, complaintDbId], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({
            message: "Failed to update status",
          });
        }

        const historySql = `
          INSERT INTO complaint_updates
          (complaint_id, status, remarks, updated_by)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          historySql,
          [
            complaintDbId,
            status,
            remarks || "",
            updatedBy,
          ],
          (historyErr) => {
            if (historyErr) {
              console.error(historyErr);
              return res.status(500).json({
                message: "Status changed, but history could not be saved.",
              });
            }

            return res.json({
              message: "Complaint status updated successfully",
            });
          }
        );
      });
    });
  }
);

// =====================================================
// ASSIGN COMPLAINT - ADMIN ONLY
// =====================================================

router.put(
  "/assign/:complaintId",
  verifyToken,
  allowRoles("Admin"),
  (req, res) => {
    const { complaintId } = req.params;
    const { officer_id } = req.body;
    const updatedBy = req.user.id;

    if (!officer_id) {
      return res.status(400).json({
        message: "Officer ID is required",
      });
    }

    const findSql = `
      SELECT id
      FROM complaints
      WHERE complaint_id = ?
    `;

    db.query(findSql, [complaintId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to find complaint",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      const complaintDbId = results[0].id;

      const updateSql = `
        UPDATE complaints
        SET assigned_officer_id = ?, status = 'Assigned'
        WHERE id = ?
      `;

      db.query(
        updateSql,
        [officer_id, complaintDbId],
        (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({
              message: "Failed to assign complaint",
            });
          }

          const historySql = `
            INSERT INTO complaint_updates
            (complaint_id, status, remarks, updated_by)
            VALUES (?, 'Assigned', ?, ?)
          `;

          db.query(
            historySql,
            [
              complaintDbId,
              "Complaint assigned to an officer.",
              updatedBy,
            ],
            (historyErr) => {
              if (historyErr) {
                console.error(historyErr);
                return res.status(500).json({
                  message: "Complaint assigned, but history could not be saved.",
                });
              }

              return res.json({
                message: "Complaint assigned successfully",
              });
            }
          );
        }
      );
    });
  }
);

// =====================================================
// ESCALATE COMPLAINT - ADMIN / OFFICER ONLY
// =====================================================

router.put(
  "/escalate/:complaintId",
  verifyToken,
  allowRoles("Admin", "Officer"),
  (req, res) => {
    const { complaintId } = req.params;
    const updatedBy = req.user.id;

    const findSql = `
      SELECT id
      FROM complaints
      WHERE complaint_id = ?
    `;

    db.query(findSql, [complaintId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to find complaint",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      const complaintDbId = results[0].id;

      const updateSql = `
        UPDATE complaints
        SET status = 'Escalated'
        WHERE id = ?
      `;

      db.query(updateSql, [complaintDbId], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({
            message: "Failed to escalate complaint",
          });
        }

        const historySql = `
          INSERT INTO complaint_updates
          (complaint_id, status, remarks, updated_by)
          VALUES (?, 'Escalated', ?, ?)
        `;

        db.query(
          historySql,
          [
            complaintDbId,
            "Complaint escalated for further review.",
            updatedBy,
          ],
          (historyErr) => {
            if (historyErr) {
              console.error(historyErr);
              return res.status(500).json({
                message: "Complaint escalated, but history could not be saved.",
              });
            }

            return res.json({
              message: "Complaint escalated successfully",
            });
          }
        );
      });
    });
  }
);

// =====================================================
// AUTOMATIC SLA CHECK
// =====================================================

const checkSLA = () => {
  const sql = `
    SELECT id, complaint_id, status
    FROM complaints
    WHERE created_at <= NOW() - INTERVAL 3 DAY
      AND status NOT IN ('Resolved', 'Closed', 'Escalated')
  `;

  db.query(sql, (err, complaints) => {
    if (err) {
      console.error("SLA check failed:", err.message);
      return;
    }

    complaints.forEach((complaint) => {
      const updateSql = `
        UPDATE complaints
        SET status = 'Escalated'
        WHERE id = ?
      `;

      db.query(updateSql, [complaint.id], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return;
        }

        const historySql = `
          INSERT INTO complaint_updates
          (complaint_id, status, remarks)
          VALUES (?, 'Escalated', 'Automatically escalated due to SLA breach.')
        `;

        db.query(historySql, [complaint.id], (historyErr) => {
          if (historyErr) {
            console.error(historyErr);
          }
        });
      });
    });
  });
};

checkSLA();
setInterval(checkSLA, 60 * 60 * 1000);

module.exports = router;
