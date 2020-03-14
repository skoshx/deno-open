# open for Deno

> open is a package for opening URLs, files and executables. Inspired by [open](https://github.com/sindresorhus/open)

## Features

- Really simple usage
- App arguments
- Includes `xdg-open` script

###### Download

- [Normal](https://raw.githubusercontent.com/SkoshRG/deno-open/master/index.ts)

## Usage

```js
import { open } from 'https://deno.land/x/open/index.ts';

// Opens the image in the default image viewer and waits for the opened app to quit.
await open('image.png', {wait: true});

// Opens the URL in the default browser.
await open('https://google.com');

// Opens the URL in a specified browser.
await open('https://google.com', {app: 'firefox'});

// Specify app arguments.
await open('https://google.com', {app: ['google chrome', '--incognito']});
```

## API

It uses the command `open` on macOS, `start` on Windows and `xdg-open` on other platforms.

### open(target, options?)

Returns a promise for the spawned Deno process.

### target: `string`

The URL, file or executable you want to open.

### options: `OpenOptions` (Optional)

#### wait: `boolean`

Waits for the spawned process to end, before resolving the Promise.

#### background: `boolean` (macOS only)

Opens the app in the background.

#### app: `string | string[]`

Specify the app you want to open the target with.

#### url: `boolean`

Encodes target with `encodeURI`. Useful for opening URLs.
