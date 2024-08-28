const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Get video information
    exec(`yt-dlp -J ${url}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Failed to retrieve video information. Please check the URL or try again.' });
        }

        // Parse video info
        let videoInfo;
        try {
            videoInfo = JSON.parse(stdout);
        } catch (parseError) {
            console.error(`JSON parse error: ${parseError}`);
            return res.status(500).json({ error: 'Failed to parse video information.' });
        }

        const originalTitle = videoInfo.title || 'video';
        const safeFilename = originalTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '') + '.mp4';
        const filename = path.join(__dirname, safeFilename);

        // List formats
        exec(`yt-dlp --list-formats ${url}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                console.error(`stderr: ${stderr}`);
                return res.status(500).json({ error: 'Failed to list formats. Please check the URL or try again.' });
            }

            const formats = stdout.split('\n');
            let formatId = 'bestvideo+bestaudio';

            for (const format of formats) {
                if (format.includes('720p')) {
                    formatId = format.split(' ')[0];
                    break;
                }
            }

            exec(`yt-dlp -f ${formatId} --output "${filename}" ${url}`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`exec error: ${err}`);
                    console.error(`stderr: ${stderr}`);
                    return res.status(500).json({ error: 'Failed to download video. Please check the URL or format.' });
                }

                res.download(filename, (downloadErr) => {
                    if (downloadErr) {
                        console.error(`Error sending file: ${downloadErr}`);
                        return res.status(500).json({ error: 'Failed to send file. Please try again.' });
                    }

                    fs.unlink(filename, (unlinkErr) => {
                        if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
                    });
                });
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
