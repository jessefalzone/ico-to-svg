# ico-to-svg

A quick and dirty command to convert .ico icons to .svg. I needed a tool to
batch process icons for research and learning purposes.

### Sample input (.ico)

<p float="left">
  <img src="./network.ico" width="150" alt="Network icon">
  <img src="./agent.ico" width="150" alt="Agent icon">
</p>

### Sample output (.svg)

<p float="left">
  <img src="./network_48x48.svg" width="150" alt="Network svg">
  <img src="./agent_32x32.svg" width="150" alt="Agent svg">
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
Usage: i2s [options] <icons...>

Converts .ico icons to SVGs.

Arguments:
  icons                  One or more icons or paths

Options:
  -o, --output [output]  Output directory (default: "./svg")
  -h, --help             display help for command
```

<br>

Heavily inspired by the efforts of [React95](https://github.com/React95/React95)
and [pixel-perfect-svg](https://github.com/kagof/pixel-perfect-svg).
