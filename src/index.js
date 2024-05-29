import path from 'path';
import { parseICO } from 'icojs';
import { readdir, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { loadPixels } from 'pixel-perfect-svg/dist/imageLoader.js';
import { toSvgString } from 'pixel-perfect-svg/dist/imageProcessor.js';
import { optimize } from 'svgo';

/**
 * Collect icons and dedupe them.
 * @param {Array} input List of icons and/or directories to convert.
 * @param {any} outputDir
 * @returns {Promise}
 */
export async function processIcons(input, outputDir) {
    let iconPaths = [];

    for (const filename of input) {
        const fileOrDir = path.resolve(filename);
        const stats = await stat(fileOrDir);

        if (stats.isDirectory()) {
            const icons = await getIconsFromDirectory(fileOrDir);
            iconPaths = iconPaths.concat(icons);
        } else {
            iconPaths.push(fileOrDir);
        }
    }

    // De-dupe icon paths.
    iconPaths = [...new Set(iconPaths)];

    if (!iconPaths.length) {
        console.log('No icons found.');
        return;
    }

    makeIcons(iconPaths, outputDir);
}

/**
 * Deep search for ICO files in a given directory.
 * @param {String} dir The directory to search.
 * @returns {Array} The list of filenames found.
 */
async function getIconsFromDirectory(dir) {
    try {
        const files = await readdir(dir, { recursive: true });
        return files.reduce(function (result, name) {
            if (path.extname(name) === '.ico') {
                result.push(path.join(dir, name));
            }
            return result;
        }, []);
    } catch (err) {
        console.error(err);
    }
}

/**
 * Convert the ICO to a PNG.
 * @param {String} filePath Full path of the icon file.
 * @returns {Object} An object with all variants.
 */
async function extractPNGFromICO(filePath) {
    const iconName = filePath
        // Separate file name from the full path.
        .split('/')
        .at(-1)
        // Remove the file extension.
        .split('.')[0]
        .split('_')
        .join('');

    const iconsBuffer = await readFile(filePath);

    /** Used to avoid adding the same icon variant multiple times */
    const addedVariants = [];
    const parsedIcon = await parseICO(iconsBuffer, 'image/png');
    const iconVariants = parsedIcon
        .map((image) => {
            const variant = `${image.width}x${image.height}_${image.bpp}`;
            const imageId = `${iconName}_${variant}`;

            return {
                ...image,
                width: image.width,
                height: image.height,
                variant: variant,
                id: imageId,
            };
        })
        .filter((icon) => {
            if (addedVariants.includes(icon.id)) {
                return false;
            }
            addedVariants.push(icon.id);
            return true;
        });

    // Now generate SVGs from each variant.
    for (const variant of iconVariants) {
        await toSVG(variant);
    }

    return {
        name: iconName,
        variants: iconVariants,
    };
}

/**
 * Save a variant as an SVG.
 * @param {Object} variant A variant extracted from the ICO.
 * @returns {Promise}
 */
async function toSVG(variant) {
    const pixels = await loadPixels({
        input: Buffer.from(variant.buffer),
        mimeType: 'image/png',
        debug: (str) => str,
    });

    const svg = await toSvgString({
        frame: pixels[0],
        noMetadata: true,
    });

    const { data: optimized } = optimize(svg);
    return await writeFile(path.join('./svg', `${variant.id}.svg`), optimized);
}

/**
 * Kick off creation of icons.
 * @param {Array} iconPaths The full paths of the icons to convert.
 * @param {any} outputDir
 */
export async function makeIcons(iconPaths, outputDir) {
    try {
        await stat(outputDir);
    } catch (e) {
        if (e.code === 'ENOENT') {
            await mkdir(outputDir, { recursive: true });
        } else {
            throw e;
        }
    }

    await Promise.all(iconPaths.map(extractPNGFromICO));
    console.log('Done.');
}
