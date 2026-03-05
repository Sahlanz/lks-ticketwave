const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { sendMessage } = require('../services/sqs');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// POST purchase tickets
router.post('/purchase', async (req, res) => {
  try {
    const { event_id, customer_name, customer_email,
            customer_phone, quantity } = req.body;

    if (!event_id || !customer_name || !customer_email || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'event_id, customer_name, customer_email, and quantity are required'
      });
    }

    // Get event details
    const eventResult = await dynamo.send(new GetCommand({
      TableName: process.env.DYNAMODB_EVENTS,
      Key: { id: event_id }
    }));

    if (!eventResult.Item) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = eventResult.Item;
    const qty = parseInt(quantity);

    if (event.available_tickets < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.available_tickets} tickets available`
      });
    }

    if (qty < 1 || qty > 5) {
      return res.status(400).json({
        success: false,
        message: 'You can purchase between 1 and 5 tickets per transaction'
      });
    }

    const booking = {
      id: 'BKG-' + uuidv4().substring(0, 8).toUpperCase(),
      event_id,
      event_title: event.title,
      venue: event.venue,
      event_date: event.date,
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      quantity: qty,
      price_per_ticket: event.price,
      total_price: event.price * qty,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await sendMessage(process.env.SQS_PURCHASES_URL, booking);

    res.status(201).json({
      success: true,
      message: 'Purchase submitted successfully. Confirmation will be sent to your email.',
      booking_id: booking.id,
      total_price: booking.total_price,
      quantity: qty,
      event: event.title
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
