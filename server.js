const express = require('express');
const bodyParser = require('body-parser');
const ytDlp = require('yt-dlp-dl');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Fetch video info using yt-dlp-dl
        const videoInfo = await ytDlp.getInfo(url);

        const originalTitle = videoInfo.title || 'video';
        const safeFilename = originalTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '') + '.mp4';
        const filepath = path.join(__dirname, safeFilename);

        // Download video
        await ytDlp.exec(url, {
            output: filepath,
            format: 'bestvideo+bestaudio'
        });

        // Send the file to the client
        res.download(filepath, (downloadErr) => {
            if (downloadErr) {
                console.error(`Error sending file: ${downloadErr}`);
                return res.status(500).json({ error: 'Failed to send file. Please try again.' });
            }

            // Delete the file after sending it to the client
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
            });
        });

    } catch (error) {
        console.error(`Error: ${error}`);
        return res.status(500).json({ error: 'Failed to download video. Please check the URL or try again.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
