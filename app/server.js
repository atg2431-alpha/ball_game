const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse raw binary data (WebM video)
// We set a high limit because videos can be large
app.use(express.raw({ type: 'video/webm', limit: '500mb' }));

// Serve the 'web' directory statically
app.use(express.static(path.join(__dirname, '../web')));

// Ensure video_files directory exists
const videoDir = path.join(__dirname, '../video_files');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}

// Endpoint to handle video uploads
app.post('/api/upload-recording', (req, res) => {
  if (!req.body || !Buffer.isBuffer(req.body)) {
    return res.status(400).send('No video data received');
  }

  const filename = req.query.filename || `recording_${Date.now()}.webm`;
  const filePath = path.join(videoDir, filename);

  fs.writeFile(filePath, req.body, (err) => {
    if (err) {
      console.error('Error saving video:', err);
      return res.status(500).send('Failed to save video');
    }
    console.log(`Video saved to: ${filePath}`);
    res.status(200).send({ message: 'Video saved successfully', path: filePath });
  });
});

app.listen(PORT, () => {
  console.log(`Game server running at http://localhost:${PORT}`);
});
