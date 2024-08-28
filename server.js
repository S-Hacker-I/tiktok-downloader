const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const ytDlpDl = require('yt-dlp-dl'); // Import the yt-dlp-dl package

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Step 1: Get video information to determine the original filename
    ytDlpDl.getInfo(url).then(info => {
        const originalTitle = info.title || 'video';
        const safeFilename = originalTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '') + '.mp4';

        // Step 2: Download the video using yt-dlp-dl
        ytDlpDl.download(url, { format: 'bestvideo+bestaudio', output: path.join(__dirname, safeFilename) })
            .then(() => {
                // Step 3: Send the file to the client
                res.download(path.join(__dirname, safeFilename), (downloadErr) => {
                    if (downloadErr) {
                        console.error(`Error sending file: ${downloadErr}`);
                        return res.status(500).json({ error: 'Failed to send file. Please try again.' });
                    }

                    // Delete the file after sending it to the client
                    fs.unlink(path.join(__dirname, safeFilename), (unlinkErr) => {
                        if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
                    });
                });
            })
            .catch(downloadErr => {
                console.error(`Download error: ${downloadErr}`);
                res.status(500).json({ error: 'Failed to download video. Please check the URL or format.' });
            });
    }).catch(error => {
        console.error(`Error retrieving video info: ${error}`);
        res.status(500).json({ error: 'Failed to retrieve video information. Please check the URL or try again.' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
