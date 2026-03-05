const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { ScanCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET all active events
router.get('/', async (req, res) => {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_EVENTS
    }));
    const items = (result.Items || [])
      .filter(e => e.status === 'active')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, total: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single event
router.get('/:id', async (req, res) => {
  try {
    const { GetCommand } = require('@aws-sdk/lib-dynamodb');
    const result = await dynamo.send(new GetCommand({
      TableName: process.env.DYNAMODB_EVENTS,
      Key: { id: req.params.id }
    }));
    if (!result.Item) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: result.Item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new event
router.post('/', async (req, res) => {
  try {
    const { title, description, venue, date,
            category, price, total_tickets, organizer } = req.body;

    if (!title || !venue || !date || !price || !total_tickets) {
      return res.status(400).json({
        success: false,
        message: 'Title, venue, date, price, and total_tickets are required'
      });
    }

    const event = {
      id: 'EVT-' + uuidv4().substring(0, 8).toUpperCase(),
      title, description: description || '',
      venue, date, category: category || 'General',
      price: Number(price),
      total_tickets: Number(total_tickets),
      available_tickets: Number(total_tickets),
      organizer: organizer || 'TicketWave',
      banner_url: '',
      status: 'active',
      created_at: new Date().toISOString()
    };

    await dynamo.send(new PutCommand({
      TableName: process.env.DYNAMODB_EVENTS,
      Item: event
    }));

    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
