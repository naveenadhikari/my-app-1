const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from feature branch!' });
});

// Health check endpoint — used by Jenkins after deploy
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    branch: process.env.BRANCH_NAME || 'unknown',
    uptime: process.uptime()
  });
});

module.exports = app;

if (require.main === module) {
  // Read port from environment variable, fallback to 3000
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}