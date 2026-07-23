import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 200 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [];

    if (status && status !== 'All') {
      params.push(status);
      conditions.push(`pickup_status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const n = params.length;
      conditions.push(`(LOWER(member_name) LIKE $${n} OR LOWER(drug_name) LIKE $${n} OR LOWER(rx_id) LIKE $${n} OR LOWER(member_id) LIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
         rx_id            AS "id",
         member_id        AS "memberId",
         member_name      AS "memberName",
         drug_name        AS "drugName",
         drug_strength    AS "drugStrength",
         drug,
         TO_CHAR(prescription_date, 'YYYY-MM-DD') AS "prescriptionDate",
         TO_CHAR(fill_date,         'YYYY-MM-DD') AS "fillDate",
         TO_CHAR(pickup_deadline,   'YYYY-MM-DD') AS "pickupDeadline",
         pickup_status    AS "pickupStatus",
         ready_for_pickup AS "readyForPickup",
         store_id         AS "storeId",
         store_name       AS "storeName",
         store_address    AS "storeAddress",
         prescriber_id    AS "prescriberId",
         prescriber,
         specialty,
         plan_id          AS "planId",
         plan_name        AS "planName",
         plan_type        AS "planType",
         preferred_channel AS "preferredChannel",
         sms_permission   AS "smsPermission",
         email_permission AS "emailPermission",
         push_permission  AS "pushPermission",
         phone,
         email,
         city,
         state
       FROM prescription_fills
       ${where}
       ORDER BY rx_id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /prescriptions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
