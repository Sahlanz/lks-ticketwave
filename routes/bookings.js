const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_BOOKINGS
    }));
    const items = (result.Items || []).sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
    res.json({ success: true, total: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
