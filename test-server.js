const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is healthy' });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
