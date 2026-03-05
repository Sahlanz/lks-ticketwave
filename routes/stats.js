const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [eventsRes, bookingsRes] = await Promise.all([
      dynamo.send(new ScanCommand({ TableName: process.env.DYNAMODB_EVENTS })),
      dynamo.send(new ScanCommand({ TableName: process.env.DYNAMODB_BOOKINGS }))
    ]);

    const events = eventsRes.Items || [];
    const bookings = bookingsRes.Items || [];
    const confirmed = bookings.filter(b => b.status === 'confirmed');

    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const totalTicketsSold = confirmed.reduce((sum, b) => sum + (b.quantity || 0), 0);

    const byCategory = {};
    events.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_events: events.length,
        active_events: events.filter(e => e.status === 'active').length,
        total_bookings: bookings.length,
        confirmed_bookings: confirmed.length,
        total_tickets_sold: totalTicketsSold,
        total_revenue: totalRevenue,
        events_by_category: byCategory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
