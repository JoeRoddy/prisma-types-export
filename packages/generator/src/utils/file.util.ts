import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { readdir as readdirProm, stat as statProm } from 'fs/promises';
import path from 'path';

// https://gist.github.com/drodsou/de2ba6291aea67ffc5bc4b52d8c32abd
export const writeFileSafely = (filename: string, content: string) => {
  // -- normalize path separator to '/' instead of path.sep,
  // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g, '/');

  // -- preparation to allow absolute paths as well
  let root = '';
  if (filepath[0] === '/') {
    root = '/';
    filepath = filepath.slice(1);
  } else if (filepath[1] === ':') {
    root = filepath.slice(0, 3); // c:\
    filepath = filepath.slice(3);
  }

  // -- create folders all the way down
  const folders = filepath.split('/').slice(0, -1); // remove last item, file
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + '/';
      if (!existsSync(folderPath)) {
        mkdirSync(folderPath);
      }
      return folderPath;
    },
    root // first 'acc', important
  );

  // -- write file
  writeFileSync(root + filepath, content);
};

export const cpFileSafely = (source: string, target: string) => {
  const targetDir = path.dirname(target);
  const parentDirExists = existsSync(targetDir);
  if (!parentDirExists) mkdirSync(targetDir, { recursive: true });

  copyFileSync(source, target);
};

export const readFileAsString = (filepath: string) =>
  readFileSync(filepath, { encoding: 'utf8', flag: 'r' });

export const deleteDirSafely = (dirPath: string) => {
  const exists = existsSync(dirPath);
  exists && rmSync(dirPath, { recursive: true, force: true });
};

export const readFilesRecursively = async (directoryPath: string): Promise<string[]> => {
  let filePaths: string[] = [];
  try {
    const files = await readdirProm(directoryPath);

    for await (const file of files) {
      const filePath = path.join(directoryPath, file);
      const item = await statProm(filePath);

      if (item.isDirectory()) {
        const subFiles = await readFilesRecursively(filePath);
        filePaths = filePaths.concat(subFiles);
      } else filePaths.push(filePath);
    }
  } catch (error) {
    console.error('Error reading files:', error);
  }
  return filePaths;
};
