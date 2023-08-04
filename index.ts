// deno-lint-ignore-file no-async-promise-executor
import { join } from 'https://deno.land/std@0.106.0/path/posix.ts';
import { isWsl } from 'https://deno.land/x/is_wsl@v1.1.0/mod.ts';
const { os } = Deno.build;

/**
* Returns the directory where this file exists.
* @param url Value returned from import.meta.url
*/
export function getDir(url: string) {
  const u = new URL(url);
  const file: string = u.protocol === 'file:' ? u.pathname : url;
  const directory = file.replace(/[/][^/]*$/, '');
  return directory;
}

export interface OpenOptions {
  /**
  Wait for the opened app to exit before fulfilling the promise. If `false` it's fulfilled immediately when opening the app.
  Note that it waits for the app to exit, not just for the window to close.
  On Windows, you have to explicitly specify an app for it to be able to wait.
  @default false
  */
  readonly wait?: boolean;
  
  /**
  __macOS only__
  Do not bring the app to the foreground.
  @default false
  */
  readonly background?: boolean;
  
  /**
  Specify the app to open the `target` with, or an array with the app and app arguments.
  The app name is platform dependent. Don't hard code it in reusable modules. For example, Chrome is `google chrome` on macOS, `google-chrome` on Linux and `chrome` on Windows.
  You may also pass in the app's full path. For example on WSL, this can be `/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe` for the Windows installation of Chrome.
  */
  app?: string | string[];
  
  /**
  Uses `encodeURI` to encode the `target` before executing it.
  The use with targets that are not URLs is not recommended.
  Especially useful when dealing with the [double-quotes on Windows](https://github.com/sindresorhus/open#double-quotes-on-windows) caveat.
  @default false
  */
  readonly url?: boolean;
}

async function isFile(fileName: string): Promise<boolean> {
  try {
    const info = await Deno.stat(fileName)
    return info.isFile
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false; // File or directory exists
    } else { throw err; }
  }
}

// Path to included `xdg-open`.
const localXdgOpenPath = join(getDir(import.meta.url), 'xdg-open');

export async function open(target: string, options?: OpenOptions): Promise<Deno.ChildProcess> {
  if (typeof target !== 'string') {
    throw new TypeError('Expected a target');
  }
  
  const defaults = {
    wait: false,
    background: false,
    url: false
  };
  
  options = { ...defaults, ...options };
  
  let command;
  let appArguments: string[] = [];
  const cliArguments: string[] = [];
  
  if (Array.isArray(options.app)) {
    appArguments = options.app.slice(1);
    options.app = options.app[0];
  }
  
  // Encodes the target as if it were an URL. Especially useful to get
  // double-quotes through the “double-quotes on Windows caveat”, but it
  // can be used on any platform.
  if (options.url) {
    target = encodeURI(target);
  }
  
  if (os === 'darwin') {
    command = 'open';
    
    if (options.wait) {
      cliArguments.push('--wait-apps');
    }
    
    if (options.background) {
      cliArguments.push('--background');
    }
    
    if (options.app) {
      cliArguments.push('-a', options.app);
    }
  } else if (os === 'windows') {
    command = 'cmd';
    cliArguments.push('/c', 'start', '');
    
    if (options.wait) {
      cliArguments.push('/wait');
    }
    
    if (options.app) {
      cliArguments.push(options.app);
    }
    
    if (appArguments.length > 0) {
      cliArguments.push(...appArguments);
    }
  } else {
    const wsl = await isWsl();
    if (options.app) {
      command = options.app;
    } else if (wsl) {
      command = 'wslview';
    } else {
      // When bundled by Webpack, there's no actual package file path and no local `xdg-open`.
      const isBundled = !getDir(import.meta.url) || getDir(import.meta.url) === '/';
      
      // Check if local `xdg-open` exists and is executable.
      const exeLocalXdgOpen = await isFile(localXdgOpenPath);
      
      const useSystemXdgOpen = isBundled || !exeLocalXdgOpen;
      command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
    }
    
    if (appArguments.length > 0) {
      cliArguments.push(...appArguments);
    }
  }
  
  if (os === 'windows') 
    cliArguments.push(target.replaceAll(/&/g, '"&"'))
  else 
    cliArguments.push(target)
  
  
  if (os === 'darwin' && appArguments.length > 0) {
    cliArguments.push('--args', ...appArguments);
  }
 
  const subprocess = new Deno.Command(command, {
    args: cliArguments,
    stdout: 'piped',
    stderr: 'piped',
    stdin: 'piped',
    windowsRawArguments: os === 'windows'
  }).spawn()

  // command: open /Applications/Google\ Chrome.app {url}
  if (options.wait) {
    return new Promise(async (resolve, reject) => {
      const status = await subprocess.status;
      const err = (await subprocess.stderr.getReader().read()).value;
      if (err) {
        if (err.length !== 0) reject(new TextDecoder().decode(err));
      }

      if (status.code && status.code > 0) {
        reject(new Error(`Exited with code ${status.code}`));
        return;
      }
      
      resolve(subprocess);
    });
  } else await subprocess.output()
  return subprocess;
}
