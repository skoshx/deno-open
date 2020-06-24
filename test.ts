import { assert, assertEquals } from 'https://deno.land/std@0.58.0/testing/asserts.ts';
import { isAbsolute } from 'https://deno.land/std@0.58.0/path/posix.ts';
import { getDir, open } from './index.ts';
const { os } = Deno.build;

// Tests for open Deno package

let chromeName: string;
let firefoxName: string;

if (os === 'darwin') {
	chromeName = 'google chrome canary';
	firefoxName = 'firefox';
} else if (os === 'windows') {
	chromeName = 'Chrome';
	firefoxName = 'C:\\Program Files\\Mozilla Firefox\\firefox.exe';
} else if (os === 'linux') {
	chromeName = 'google-chrome';
	firefoxName = 'firefox';
}

function closeResourceHandles () {
  const resourceIds = Object.keys(Deno.resources()).map(strId => parseInt(strId)).slice(3,)
  resourceIds.forEach(id => Deno.close(id))
}

Deno.test({
  name: 'getDir works',
  fn(): void {
    const currentDir = getDir(import.meta.url);
    assert(isAbsolute(currentDir));
    assertEquals(currentDir.substr(currentDir.length - 4, currentDir.length), 'open');
  }
});

Deno.test({
  name: 'open works without options',
  async fn(): Promise<void> {
    await open('index.ts');
    closeResourceHandles()
  }
});

Deno.test({
  name: 'open waits',
  async fn(): Promise<void> {
    const response = await open('test.png', { wait: true });
    // @ts-ignore: Uncompatible types
    // assert(response.length === 0);
    closeResourceHandles()
  }
});

Deno.test({
  name: 'url gets encoded',
  async fn(): Promise<void> {
    await open('https://google.com', { url: true });
    closeResourceHandles()
  }
});

Deno.test({
  name: 'open works with arguments',
  async fn(): Promise<void> {
    await open('https://google.com', { app: [chromeName, '--incognito'] });
    closeResourceHandles()
  }
});

Deno.test({
  name: 'returns process',
  async fn(): Promise<void> {
    const process: Deno.Process = await open('https://google.com');
    assert(typeof process.pid === 'number');
    assert(process.pid !== 0);
    closeResourceHandles()
  }
});
