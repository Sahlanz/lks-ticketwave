const { S3Client, PutObjectCommand,
        GetObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

const ASSETS_BUCKET = process.env.S3_ASSETS_BUCKET;

async function uploadReceipt(bookingId, content) {
  const key = `receipts/${bookingId}.json`;
  await client.send(new PutObjectCommand({
    Bucket: ASSETS_BUCKET,
    Key: key,
    Body: JSON.stringify(content, null, 2),
    ContentType: 'application/json'
  }));
  return `https://${ASSETS_BUCKET}.s3.amazonaws.com/${key}`;
}

async function uploadBanner(eventId, buffer, contentType) {
  const key = `banners/${eventId}.jpg`;
  await client.send(new PutObjectCommand({
    Bucket: ASSETS_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'image/jpeg'
  }));
  return `https://${ASSETS_BUCKET}.s3.amazonaws.com/${key}`;
}

module.exports = { uploadReceipt, uploadBanner };
