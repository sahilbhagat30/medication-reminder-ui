import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rxResult, notifResult, campaignResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                                      AS total_prescriptions,
          COUNT(DISTINCT member_id)                                     AS total_members,
          COUNT(*) FILTER (WHERE pickup_status = 'Pending Pickup')      AS pending_pickups
        FROM prescription_fills
      `),
      pool.query(`
        SELECT
          COUNT(*)                                              AS notifications_sent,
          COUNT(*) FILTER (WHERE status = 'Delivered')         AS delivered_count,
          COUNT(*) FILTER (WHERE status = 'Sent')              AS sent_count,
          COUNT(*) FILTER (WHERE status = 'Failed')            AS failed_count,
          ROUND(
            COUNT(*) FILTER (WHERE status = 'Delivered') * 100.0 / NULLIF(COUNT(*), 0)
          )                                                     AS delivery_success_rate
        FROM communication_logs
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Active')   AS active_campaigns,
          COUNT(*)                                     AS total_campaigns
        FROM campaigns
      `),
      pool.query(`
        SELECT
          channel,
          COUNT(*)                                     AS sent,
          COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered,
          COUNT(*) FILTER (WHERE status = 'Failed')    AS failed
        FROM communication_logs
        GROUP BY channel
        ORDER BY channel
      `),
    ]);

    const rx   = rxResult.rows[0];
    const notif = notifResult.rows[0];
    const camp  = campaignResult.rows[0];

    res.json({
      totalPrescriptions:  Number(rx.total_prescriptions),
      totalMembers:        Number(rx.total_members),
      pendingPickups:      Number(rx.pending_pickups),
      eligibleMembers:     Number(rx.total_members),   // approximation for demo
      notificationsSent:   Number(notif.notifications_sent),
      deliveredCount:      Number(notif.delivered_count),
      sentCount:           Number(notif.sent_count),
      failedCount:         Number(notif.failed_count),
      deliverySuccessRate: Number(notif.delivery_success_rate) || 0,
      activeCampaigns:     Number(camp.active_campaigns),
      avgResponseTime:     '4.2 min',
    });
  } catch (err) {
    console.error('GET /summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
