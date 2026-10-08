const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");

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
// SUBMIT COMPLAINT
// =====================================================

router.post(
  "/submit",
  upload.single("supporting_file"),
  (req, res) => {
    const {
      user_id,
      category,
      description,
      location,
    } = req.body;

    const supportingFile = req.file
      ? req.file.filename
      : null;

    if (!user_id || !category || !description || !location) {
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
        user_id,
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
          (
            complaint_id,
            status,
            remarks,
            updated_by
          )
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          updateSql,
          [
            result.insertId,
            "Submitted",
            "Complaint registered successfully.",
            user_id,
          ],
          (updateErr) => {
            if (updateErr) {
              console.error(updateErr);
            }

            res.status(201).json({
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
// MY COMPLAINTS - CITIZEN
// =====================================================

router.get("/my-complaints/:userId", (req, res) => {
  const { userId } = req.params;

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

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch complaints",
      });
    }

    res.json(results);
  });
});

// =====================================================
// TRACK COMPLAINT
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

  db.query(
    complaintSql,
    [complaintId],
    (err, complaints) => {
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
        SELECT
          status,
          remarks,
          created_at
        FROM complaint_updates
        WHERE complaint_id = ?
        ORDER BY created_at ASC
      `;

      db.query(
        updatesSql,
        [complaint.id],
        (err, updates) => {
          if (err) {
            console.error(err);

            return res.status(500).json({
              message: "Failed to fetch complaint timeline",
            });
          }

          res.json({
            complaint,
            updates,
          });
        }
      );
    }
  );
});

// =====================================================
// ALL COMPLAINTS - OFFICER / ADMIN
// =====================================================

router.get("/all", (req, res) => {
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
    JOIN users u
      ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch complaints",
      });
    }

    res.json(results);
  });
});

// =====================================================
// UPDATE COMPLAINT STATUS
// =====================================================

router.put(
  "/update-status/:complaintId",
  (req, res) => {
    const { complaintId } = req.params;

    const {
      status,
      remarks,
      updated_by,
    } = req.body;

    if (!status || !updated_by) {
      return res.status(400).json({
        message: "Status and officer ID are required",
      });
    }

    const findSql = `
      SELECT id
      FROM complaints
      WHERE complaint_id = ?
    `;

    db.query(
      findSql,
      [complaintId],
      (err, results) => {
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

        db.query(
          updateSql,
          [status, complaintDbId],
          (err) => {
            if (err) {
              console.error(err);

              return res.status(500).json({
                message: "Failed to update status",
              });
            }

            const historySql = `
              INSERT INTO complaint_updates
              (
                complaint_id,
                status,
                remarks,
                updated_by
              )
              VALUES (?, ?, ?, ?)
            `;

            db.query(
              historySql,
              [
                complaintDbId,
                status,
                remarks || "",
                updated_by,
              ],
              (historyErr) => {
                if (historyErr) {
                  console.error(historyErr);
                }

                res.json({
                  message:
                    "Complaint status updated successfully",
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// ASSIGN COMPLAINT TO OFFICER
// =====================================================

router.put(
  "/assign/:complaintId",
  (req, res) => {
    const { complaintId } = req.params;

    const {
      officer_id,
      updated_by,
    } = req.body;

    if (!officer_id || !updated_by) {
      return res.status(400).json({
        message:
          "Officer ID and updater ID are required",
      });
    }

    const findSql = `
      SELECT id
      FROM complaints
      WHERE complaint_id = ?
    `;

    db.query(
      findSql,
      [complaintId],
      (err, results) => {
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
          SET
            assigned_officer_id = ?,
            status = 'Assigned'
          WHERE id = ?
        `;

        db.query(
          updateSql,
          [officer_id, complaintDbId],
          (err) => {
            if (err) {
              console.error(err);

              return res.status(500).json({
                message:
                  "Failed to assign complaint",
              });
            }

            const historySql = `
              INSERT INTO complaint_updates
              (
                complaint_id,
                status,
                remarks,
                updated_by
              )
              VALUES (?, 'Assigned', ?, ?)
            `;

            db.query(
              historySql,
              [
                complaintDbId,
                "Complaint assigned to an officer.",
                updated_by,
              ],
              (historyErr) => {
                if (historyErr) {
                  console.error(historyErr);
                }

                res.json({
                  message:
                    "Complaint assigned successfully",
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// ESCALATE COMPLAINT
// =====================================================

router.put(
  "/escalate/:complaintId",
  (req, res) => {
    const { complaintId } = req.params;
    const { updated_by } = req.body;

    if (!updated_by) {
      return res.status(400).json({
        message: "Officer/Admin ID is required",
      });
    }

    const findSql = `
      SELECT id
      FROM complaints
      WHERE complaint_id = ?
    `;

    db.query(
      findSql,
      [complaintId],
      (err, results) => {
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

        db.query(
          updateSql,
          [complaintDbId],
          (err) => {
            if (err) {
              console.error(err);

              return res.status(500).json({
                message:
                  "Failed to escalate complaint",
              });
            }

            const historySql = `
              INSERT INTO complaint_updates
              (
                complaint_id,
                status,
                remarks,
                updated_by
              )
              VALUES (?, 'Escalated', ?, ?)
            `;

            db.query(
              historySql,
              [
                complaintDbId,
                "Complaint escalated for further review.",
                updated_by,
              ],
              (historyErr) => {
                if (historyErr) {
                  console.error(historyErr);
                }

                res.json({
                  message:
                    "Complaint escalated successfully",
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// AUTOMATIC SLA CHECK
// =====================================================

const checkSLA = () => {
  const sql = `
    SELECT
      id,
      complaint_id,
      status
    FROM complaints
    WHERE created_at <= NOW() - INTERVAL 3 DAY
      AND status NOT IN
      ('Resolved', 'Closed', 'Escalated')
  `;

  db.query(
    sql,
    (err, complaints) => {
      if (err) {
        console.error(
          "SLA check failed:",
          err.message
        );
        return;
      }

      complaints.forEach(
        (complaint) => {
          const updateSql = `
            UPDATE complaints
            SET status = 'Escalated'
            WHERE id = ?
          `;

          db.query(
            updateSql,
            [complaint.id],
            (updateErr) => {
              if (updateErr) {
                console.error(updateErr);
                return;
              }

              const historySql = `
                INSERT INTO complaint_updates
                (
                  complaint_id,
                  status,
                  remarks
                )
                VALUES
                (
                  ?,
                  'Escalated',
                  'Automatically escalated due to SLA breach.'
                )
              `;

              db.query(
                historySql,
                [complaint.id],
                (historyErr) => {
                  if (historyErr) {
                    console.error(historyErr);
                  }
                }
              );
            }
          );
        }
      );
    }
  );
};

// Run SLA check when server starts
checkSLA();

// Run SLA check every hour
setInterval(
  checkSLA,
  60 * 60 * 1000
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;