import { Observable, ObservableArray } from '@nativescript/core';
import { File, knownFolders, path } from '@nativescript/core';
import { request } from '@nativescript/core/http';
import { TNSPlayer } from 'nativescript-audio';
import { Mediafilepicker } from 'nativescript-mediafilepicker';

export function createViewModel() {
    const viewModel = new Observable();

    // ... (previous code remains the same)

    viewModel.onExportTap = async () => {
        const activeTracks = viewModel.tracks.filter(t => !t.isMuted && !viewModel.tracks.some(ot => ot.isSolo && ot !== t));
        console.log("Exporting with active tracks:", activeTracks.map(t => t.name));

        const formData = new FormData();
        activeTracks.forEach((track, index) => {
            formData.append('tracks', {
                name: `track_${index}.mp3`,
                type: 'audio/mpeg',
                uri: track.player.audioFile
            });
        });

        try {
            const response = await fetch('http://localhost:3000/combine', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const fileName = 'combined_audio.mp3';
                const folder = knownFolders.documents();
                const filePath = path.join(folder.path, fileName);
                const file = File.fromPath(filePath);
                await file.writeSync(blob, err => console.log(err));
                console.log(`File saved to ${filePath}`);
                alert(`Combined audio exported successfully to ${fileName}`);
            } else {
                console.error('Error combining tracks:', response.statusText);
                alert('Error exporting combined audio');
            }
        } catch (error) {
            console.error('Error sending tracks to API:', error);
            alert('Error exporting combined audio');
        }
    };

    // ... (rest of the code remains the same)

    return viewModel;
}