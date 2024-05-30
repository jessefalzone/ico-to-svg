import path from 'path';
import { readdir } from 'node:fs/promises';

/**
 * Deep search for files in a given directory.
 * @param {String} dir The directory to search.
 * @param {String} extension Optionally filter by file extension.
 * @returns {Array} The list of filenames found.
 */
export async function getFilesFromDirectory(dir, extension) {
    try {
        const files = await readdir(dir, { recursive: true });
        return files.reduce(function (result, name) {
            if (!extension || path.extname(name) === extension) {
                result.push(path.join(dir, name));
            }
            return result;
        }, []);
    } catch (err) {
        console.error(err);
    }
}
