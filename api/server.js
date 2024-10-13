const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/separate', upload.single('audio'), (req, res) => {
    const inputFile = req.file.path;
    const outputDir = path.join('outputs', path.basename(inputFile));

    exec(`spleeter separate -i ${inputFile} -o ${outputDir}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Error processing audio');
        }

        fs.readdir(outputDir, (err, files) => {
            if (err) {
                return res.status(500).send('Error reading output directory');
            }
            res.json(files.map(file => path.join(outputDir, file)));
        });
    });
});

app.post('/combine', upload.array('tracks', 6), (req, res) => {
    const outputFile = path.join('outputs', 'combined_' + Date.now() + '.mp3');
    const command = ffmpeg();

    req.files.forEach(file => {
        command.input(file.path);
    });

    command.mergeToFile(outputFile, 'temp/')
        .on('error', (err) => {
            console.error('An error occurred: ' + err.message);
            res.status(500).send('Error combining tracks');
        })
        .on('end', () => {
            res.download(outputFile, (err) => {
                if (err) {
                    console.error('Error sending file: ' + err);
                    res.status(500).send('Error sending combined file');
                }
                // Clean up files
                fs.unlinkSync(outputFile);
                req.files.forEach(file => fs.unlinkSync(file.path));
            });
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));