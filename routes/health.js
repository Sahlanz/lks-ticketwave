const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TicketWave',
    version: process.env.APP_VERSION || '1.0.0',
    services: {
      sqs_purchases: process.env.SQS_PURCHASES_URL ? 'configured' : 'missing',
      sqs_notifications: process.env.SQS_NOTIFICATIONS_URL ? 'configured' : 'missing',
      dynamodb_events: process.env.DYNAMODB_EVENTS || 'missing',
      dynamodb_bookings: process.env.DYNAMODB_BOOKINGS || 'missing',
      s3_assets: process.env.S3_ASSETS_BUCKET || 'missing',
      sns_confirmations: process.env.SNS_CONFIRMATIONS_ARN ? 'configured' : 'missing',
      sns_alerts: process.env.SNS_ALERTS_ARN ? 'configured' : 'missing',
      cloudwatch: process.env.CW_NAMESPACE || 'missing'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
