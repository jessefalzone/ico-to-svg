import path from 'path';
import { parseICO } from 'icojs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { promises as fs } from 'fs';
import { loadPixels } from 'pixel-perfect-svg/dist/imageLoader.js';
import { toSvgString } from 'pixel-perfect-svg/dist/imageProcessor.js';
import { optimize } from 'svgo';
import { TMP_IMAGE_FOLDER, deleteFolder, capitalizeFirst } from './utils.js';

export async function processIcons(input, outputDir) {
    let iconPaths = [];

    for (const filename of input) {
        const fileOrDir = path.resolve(filename);
        const stats = await fs.stat(fileOrDir);

        if (stats.isDirectory()) {
            const icons = await getIconsFromDirectory(fileOrDir);
            iconPaths = iconPaths.concat(icons);
        } else {
            iconPaths.push(fileOrDir);
        }
    }

    iconPaths = [...new Set(iconPaths)];

    if (!iconPaths.length) {
        console.log('No icons found.');
        return;
    }

    makeIcons(iconPaths, outputDir);
}

async function getIconsFromDirectory(dir) {
    try {
        const files = await readdir(dir, { recursive: true });
        return files.reduce(function (result, name) {
            if (path.extname(name) === '.ico') {
                result.push(path.resolve(name));
            }
            return result;
        }, []);
    } catch (err) {
        console.error(err);
    }
}

async function extractPNGFromIco(filePath) {
    // Capitalize first letter for component name
    const iconName = filePath
        // Remove the file extension
        .split('/')
        .at(-1)
        .split('.')[0]
        .split('_')
        .map(capitalizeFirst)
        .join('');

    const iconsBuffer = await readFile(filePath);

    /** Used to avoid adding the same icon variant multiple times */
    const addedVariants = [];
    const parsedIcon = await parseICO(iconsBuffer, 'image/png');
    const iconVariants = parsedIcon
        .map((image) => {
            const variant = `${image.width}x${image.height}_${image.bpp}`;
            const imageId = `${iconName}_${variant}`;

            const imageFileName = `${TMP_IMAGE_FOLDER}/${imageId}.png`;

            return {
                ...image,
                width: image.width,
                height: image.height,
                filePath: imageFileName,
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

    for (const variant of iconVariants) {
        const data = Buffer.from(variant.buffer);
        await writeFile(variant.filePath, data);
    }

    return {
        name: iconName,
        variants: iconVariants,
    };
}

async function toSVG(icons, outputDir) {
    console.log('Generating SVG components...');

    return await Promise.all(
        icons.map(async ({ variants }) => {
            return await Promise.all(
                variants.map(async (variant) => {
                    const pixels = await loadPixels({
                        input: variant.filePath,
                        mimeType: 'image/png',
                        debug: (str) => str,
                    });

                    const svg = await toSvgString({
                        frame: pixels[0],
                        noMetadata: true,
                    });

                    const { data: optimized } = optimize(svg);

                    // Writing individual SVG files
                    await writeFile(
                        path.join(outputDir, `${variant.id}.svg`),
                        optimized
                    );
                })
            );
        })
    );
}

export async function makeIcons(iconPaths, outputDir) {
    deleteFolder(TMP_IMAGE_FOLDER);
    await fs.mkdir(TMP_IMAGE_FOLDER);

    try {
        await fs.stat(outputDir);
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.mkdir(outputDir, { recursive: true });
        } else {
            throw e;
        }
    }

    const icons = await Promise.all(iconPaths.map(extractPNGFromIco));
    await toSVG(icons, outputDir);

    deleteFolder(TMP_IMAGE_FOLDER);
    console.log('Done.');
}
