const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const client = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

async function sendConfirmation(booking) {
  const message = [
    `=== TicketWave Booking Confirmation ===`,
    ``,
    `Booking ID  : ${booking.id}`,
    `Event       : ${booking.event_title}`,
    `Venue       : ${booking.venue}`,
    `Date        : ${new Date(booking.event_date).toLocaleString('en-US')}`,
    `Tickets     : ${booking.quantity}`,
    `Total Price : Rp ${booking.total_price.toLocaleString('id-ID')}`,
    `Customer    : ${booking.customer_name}`,
    `Email       : ${booking.customer_email}`,
    ``,
    `Please bring this booking ID to the venue entrance.`,
    `Thank you for using TicketWave!`
  ].join('\n');

  return client.send(new PublishCommand({
    TopicArn: process.env.SNS_CONFIRMATIONS_ARN,
    Subject: `[TicketWave] Booking Confirmed — ${booking.event_title}`,
    Message: message
  }));
}

async function sendLowStockAlert(eventTitle, remaining) {
  return client.send(new PublishCommand({
    TopicArn: process.env.SNS_ALERTS_ARN,
    Subject: `[TicketWave ALERT] Low Ticket Stock — ${eventTitle}`,
    Message: `WARNING: Event "${eventTitle}" has only ${remaining} tickets remaining. Take immediate action.`
  }));
}

module.exports = { sendConfirmation, sendLowStockAlert };
