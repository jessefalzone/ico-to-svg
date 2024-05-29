# ico-to-svg

A quick and dirty command to convert .ico icons to .svg. I needed a tool to
batch process icons for research purposes.

Sample input:

<p float="left">
  <img src="./network.ico" width="48" alt="Network icon">
  <img src="./agent.ico" width="48" alt="Agent icon">
</p>

Sample output:

<p float="left">
  <img src="./network_48x48.svg" width="200" alt="Network svg">
  <img src="./agent_32x32.svg" width="200" alt="Agent svg">
</p>

### Installation

For now, clone the repo:

```bash
git clone git@github.com:jessefalzone/ico-to-svg.git && \
cd ico-to-svg && \
npm i
```

Then symlink the bin:

```bash
npm link
```

Check if it worked:

```bash
i2s --help
```

### Usage

```
$ i2s [--output | -o] <icon_or_directory> ...

Options
  --output, -o An optional output path; will be created if it doesn't exist.

Example
$ i2s oneIcon.ico /some/more/icons --output /path/to/output
```

<br>

Heavily inspired by the efforts of [React95](https://github.com/React95/React95)
and [pixel-perfect-svg](https://github.com/kagof/pixel-perfect-svg).
