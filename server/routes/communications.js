import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const n = params.length;
      conditions.push(`(LOWER(member_name) LIKE $${n} OR LOWER(notif_id) LIKE $${n} OR LOWER(member_id) LIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
         notif_id          AS "notifId",
         prescription_id   AS "prescriptionId",
         member_id         AS "memberId",
         member_name       AS "memberName",
         drug,
         channel,
         campaign_id       AS "campaignId",
         status,
         TO_CHAR(sent_at,      'YYYY-MM-DD HH12:MI AM') AS "sentAt",
         TO_CHAR(delivered_at, 'YYYY-MM-DD HH12:MI AM') AS "deliveredAt",
         TO_CHAR(pickup_deadline, 'YYYY-MM-DD')          AS "pickupDeadline",
         store_id          AS "storeId",
         store_name        AS "storeName",
         failure_reason    AS "failureReason",
         failure_code      AS "failureCode",
         retry_count       AS "retryCount",
         reminder_sequence AS "reminderSequence",
         suppression_reason AS "suppressionReason",
         preferred_channel AS "preferredChannel"
       FROM communication_logs
       ${where}
       ORDER BY notif_id`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /communications error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
