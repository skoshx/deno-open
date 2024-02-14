import { assert } from "https://deno.land/std@0.215.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.215.0/assert/assert_equals.ts";
import { isAbsolute } from "https://deno.land/std@0.215.0/path/posix/is_absolute.ts";
import { getDir, open } from "./index.ts";
const { os } = Deno.build;

// Tests for open Deno package

let chromeName: string;
let firefoxName: string;

if (os === "darwin") {
  chromeName = "/Applications/Google\ Chrome.app";
  firefoxName = "firefox";
} else if (os === "windows") {
  chromeName = "Chrome";
  firefoxName = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
} else if (os === "linux") {
  chromeName = "google-chrome";
  firefoxName = "firefox";
}

Deno.test({
  name: "getDir works",
  fn(): void {
    const currentDir = getDir(import.meta.url);
    assert(isAbsolute(currentDir));
    assertEquals(currentDir.slice(currentDir.length - 4), "open");
  },
});

Deno.test({
  name: "open works without options",
  async fn(): Promise<void> {
    const process = await open("index.ts");
    process.kill();
    await process.output();
  },
});

Deno.test({
  name: "open waits",
  async fn(): Promise<void> {
    const process = await open("test.png", { wait: true });
    await process.status;
  },
});

Deno.test({
  name: "url gets encoded",
  async fn(): Promise<void> {
    const process = await open("https://google.com", { url: true });
    process.kill();
    await process.output();
  },
});

Deno.test({
  name: "open works with arguments",
  async fn(): Promise<void> {
    const process = await open("https://google.com", {
      app: [chromeName, "-incognito"],
    });
    process.kill();
    await process.output();
  },
});

Deno.test({
  name: "returns process",
  async fn(): Promise<void> {
    const process: Deno.ChildProcess = await open("https://google.com");
    assert(typeof process.pid === "number");
    assert(process.pid !== 0);
    process.kill();
    await process.output();
  },
});
