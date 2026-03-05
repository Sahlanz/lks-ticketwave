require('dotenv').config();
const { dynamo } = require('./services/dynamodb');
const { receiveMessages, deleteMessage } = require('./services/sqs');
const { uploadReceipt } = require('./services/s3');
const { sendConfirmation } = require('./services/sns');
const { publishSalesMetrics } = require('./services/cloudwatch');
const { UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const PURCHASES_URL = process.env.SQS_PURCHASES_URL;

let totalTicketsSold = 0;
let totalRevenue = 0;

async function processPurchases() {
  try {
    const messages = await receiveMessages(PURCHASES_URL);

    for (const msg of messages) {
      const booking = JSON.parse(msg.Body);

      // Deduct available tickets from event
      await dynamo.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_EVENTS,
        Key: { id: booking.event_id },
        UpdateExpression: 'SET available_tickets = available_tickets - :qty',
        ConditionExpression: 'available_tickets >= :qty',
        ExpressionAttributeValues: { ':qty': booking.quantity }
      }));

      // Save booking to DynamoDB
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      await dynamo.send(new PutCommand({
        TableName: process.env.DYNAMODB_BOOKINGS,
        Item: { ...booking, status: 'confirmed', confirmed_at: new Date().toISOString() }
      }));

      // Upload receipt to S3
      await uploadReceipt(booking.id, booking);

      // Send confirmation via SNS
      await sendConfirmation(booking);

      // Update counters
      totalTicketsSold += booking.quantity;
      totalRevenue += booking.total_price;

      await deleteMessage(PURCHASES_URL, msg.ReceiptHandle);
      console.log(`[Worker] Booking ${booking.id} confirmed`);
    }
  } catch (err) {
    console.error('[Worker] Error:', err.message);
  }
}

async function publishMetrics() {
  try {
    const eventsResult = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_EVENTS,
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':active': 'active' }
    }));

    const events = eventsResult.Items || [];
    const minAvailable = events.length > 0
      ? Math.min(...events.map(e => e.available_tickets || 0))
      : 0;

    await publishSalesMetrics(totalTicketsSold, totalRevenue, events.length, minAvailable);
  } catch (err) {
    console.error('[Worker] Metrics error:', err.message);
  }
}

console.log('[Worker] TicketWave Worker started');
setInterval(processPurchases, 5000);
setInterval(publishMetrics, 30000);
