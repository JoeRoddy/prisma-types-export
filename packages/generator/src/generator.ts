import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper';
import { existsSync } from 'fs';
import path from 'path';
import { GENERATOR_NAME, VERSION } from './constants';
import {
  cpFileSafely,
  deleteDirSafely,
  readFileAsString,
  readFilesRecursively,
  writeFileSafely,
} from './utils/file.util';

const DEFAULT_OUTPUT = './prisma/types';

generatorHandler({
  onManifest() {
    console.info(`${GENERATOR_NAME}:Registered`);
    return {
      version: VERSION,
      prettyName: GENERATOR_NAME,
      defaultOutput: DEFAULT_OUTPUT,
      requiresGenerators: ['prisma-client-js'],
      example: 'hello',
    };
  },
  onGenerate: async (options: GeneratorOptions) => {
    const debugEnabled = options.generator?.config?.debug || false;
    const log = [true, 'true'].includes(debugEnabled as any) ? console.log : () => {};
    log('DEBUG_ENABLED\n\n');
    log('Generator options:\n', options.generator);
    log('prisma-types-export version', VERSION);

    const typesOutputLoc = options.generator.output?.value || DEFAULT_OUTPUT;
    const prismaLoc =
      options.otherGenerators.find((g) => g.name === 'client')?.output?.value || undefined;
    const isDefaultPrismaLoc = prismaLoc?.endsWith('node_modules/@prisma/client');
    deleteDirSafely(typesOutputLoc);

    log('prisma location:\n', prismaLoc);
    if (!prismaLoc)
      throw new Error(
        'Prisma location undefined, this should not happen, so iunno...  Pls create an issue.'
      );

    const prismaTypeFilePaths = await readFilesRecursively(prismaLoc).then((files) =>
      files.filter((f) => f.endsWith('.d.ts'))
    );

    log('types files to copy:\n', prismaTypeFilePaths);
    prismaTypeFilePaths.forEach((item) => {
      const target = item.replace(prismaLoc, typesOutputLoc);
      if (
        // skips scripts dir, and extensions file
        target.includes(path.join(typesOutputLoc, 'scripts')) ||
        target.endsWith('extension.d.ts')
      ) {
        return;
      }
      cpFileSafely(item, target);
    });
    log('files copied to: ', typesOutputLoc);

    // if not using a custom prisma output location, the prisma client reference files in
    // node_modules/.prisma/client. we need to copy those files to the output location
    // and update the imports in the files that reference them to the new copy
    if (isDefaultPrismaLoc) {
      const indexFilePath = path.join(typesOutputLoc, 'index.d.ts');
      const indexContents = readFileAsString(indexFilePath);

      if (indexContents.includes("export * from '.prisma/client'")) {
        log('updating imports like ".prisma/client" to relative local imports');
        const dotPrismaLoc = path.join(prismaLoc!, '..', '..', '.prisma', 'client', 'index.d.ts');
        const dotClientExists = existsSync(dotPrismaLoc);
        if (!dotClientExists) {
          throw new Error(
            `File not found: ${dotPrismaLoc}
            
If you're using a monorepo, like a pnpm workspace, you may need to use a custom Prisma output location, eg:
            
generator client {
  provider = "prisma-client-js"
  output   = "./prisma-client"
}`
          );
        }

        log('abt to read .prisma/client/index file');
        const clientContents = readFileAsString(dotPrismaLoc);
        log('file read, length:', clientContents.length);

        const clientWithRelativeImports = clientContents.replace(`from '@prisma/client`, `from '.`);
        log('abt to replace local index file with .prisma/client/index file');
        writeFileSafely(indexFilePath, clientWithRelativeImports);
        log('index file replaced');

        log('abt to update edge file imports to relative local');
        const edgeFilePath = path.join(typesOutputLoc, 'edge.d.ts');
        writeFileSafely(
          edgeFilePath,
          readFileAsString(edgeFilePath).replace("from '.prisma/client'", "from './index'")
        );
        log('edge file updated');
      }
    }
    log('generator complete!');

    return;
  },
});
