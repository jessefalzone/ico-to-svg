import path from 'path';
import { parseICO } from 'icojs';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { loadPixels } from 'pixel-perfect-svg/dist/imageLoader.js';
import { toSvgString } from 'pixel-perfect-svg/dist/imageProcessor.js';
import { optimize } from 'svgo';
import { getFilesFromDirectory } from './utils.js';

/**
 * Kick off creation of icons.
 * @async
 * @param {Array} iconPaths The full paths of the icons to convert.
 * @param {String} outputDir
 */
export async function makeIcons(input, outputDir) {
    const iconPaths = await gatherIcons(input);

    if (!iconPaths.length) {
        console.log('No icons found.');
        return;
    }

    console.log(`${iconPaths.length} icon(s) found.`);

    try {
        await stat(outputDir);
    } catch (e) {
        if (e.code === 'ENOENT') {
            await mkdir(outputDir, { recursive: true });
        } else {
            throw e;
        }
    }

    // await Promise.all(iconPaths.map(toPNG));
    await Promise.all(iconPaths.map((icon) => toPNG(icon, outputDir)));
    console.log('Done.');
}

/**
 * Collect icons and dedupe them.
 * @async
 * @param {Array} input List of icons and/or directories to convert.
 * @returns {Promise<Array>} The full icon paths.
 */
export async function gatherIcons(input) {
    let iconPaths = [];

    for (const filename of input) {
        const fileOrDir = path.resolve(filename);
        const stats = await stat(fileOrDir);

        if (stats.isDirectory()) {
            const icons = await getFilesFromDirectory(fileOrDir, '.ico');
            iconPaths = iconPaths.concat(icons);
        } else {
            iconPaths.push(fileOrDir);
        }
    }

    // De-dupe icon paths.
    return [...new Set(iconPaths)];
}

/**
 * Convert the ICO to a PNG.
 * @async
 * @param {String} filePath Full path of the icon file.
 * @param {String} outputDir The output directory.
 * @returns {Promise}
 */
async function toPNG(filePath, outputDir) {
    const iconName = filePath
        // Separate file name from the full path.
        .split('/')
        .at(-1)
        // Remove the file extension.
        .split('.')[0]
        .split('_')
        .join('');

    const iconsBuffer = await readFile(filePath);

    // Store variants to avoid adding the same variant multiple times.
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
        await toSVG(variant, outputDir);
    }
}

/**
 * Save a variant as an SVG.
 * @async
 * @param {Object} variant A variant extracted from the ICO.
 * @param {String} outputDir The output directory.
 * @returns {Promise}
 */
async function toSVG(variant, outputDir) {
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
    return await writeFile(
        path.join(outputDir, `${variant.id}.svg`),
        optimized
    );
}
