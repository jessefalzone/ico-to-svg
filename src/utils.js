import fs from 'fs';
import path from 'path';

const __dirname = import.meta.dirname;

export const TMP_IMAGE_FOLDER = path.join(__dirname, './png');

export function deleteFolder(path) {
    const exists = fs.existsSync(path);

    if (exists) {
        fs.rmSync(path, { recursive: true });
    }
}

export const capitalizeFirst = (word) =>
    word.charAt(0).toUpperCase() + word.slice(1);
