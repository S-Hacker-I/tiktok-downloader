const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files (e.g., index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON request bodies
app.use(express.json());

// Route to handle video download requests
app.post('/download', (req, res) => {
  const videoUrl = req.body.url;

  if (!videoUrl) {
    return res.status(400).send('URL is required');
  }

  // Construct the yt-dlp command
  const command = `./yt-dlp_linux -f bestvideo+bestaudio --merge-output-format mp4 -o "downloads/%(title)s.%(ext)s" "${videoUrl}"`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Failed to download video');
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).send('Failed to download video');
    }
    console.log(`Stdout: ${stdout}`);
    res.send('Download complete');
  });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
