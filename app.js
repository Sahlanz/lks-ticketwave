require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/health', require('./routes/health'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/stats', require('./routes/stats'));

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/events', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'events.html')));
app.get('/checkout', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.use((req, res) =>
  res.status(404).json({ message: 'Endpoint not found' }));

app.listen(PORT, () =>
  console.log(`TicketWave running on port ${PORT}`));
