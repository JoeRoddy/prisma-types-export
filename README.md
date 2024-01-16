# prisma-types-export

Export your prisma types files to a local directory, to share across multiple projects / repositories / machines.

## Up and running

1. `npm install -D prisma-types-export`

2. Add the following to your `schema.prisma` file:

   ```prisma
   generator types {
       provider = "prisma-types-export"
       output   = "./prisma-types"
   }
   ```

3. `npx prisma generate`

You should see a new directory in `/prisma/prisma-types` (you can configure this via the `output` opt).

If you want this to go directly into a separate repo, you could do something like:
`output = "../../prisma-types"`

## Using your exported types

```ts
// some standalone project, without an actual prisma client
import { Prisma, PrismaClient, Post } from './prisma-types';

const getPosts = (): Promise<Post[]> => fetch(...)

const createPost = (postData: Prisma.PostCreateInput): Promise<Post> =>
    fetch(...)
```

## Why

> Why not just copy the `/node_modules/@prisma/client` directory?

This tool does two things:

1. Copies the relevant Prisma declaration files into a local dir (skipping compiled JS files)
2. Replaces imports from `/node_modules/.prisma/client` and moves those files into the exported directory
   - without this step, your copied types would not work if you copied the dir to another project, since they can no longer resolve the imports to the sibling dependency

## Footguns

**Note about monorepos**:

If you are using a monorepo, like a pnpm workspace, you may need to add a custom output location to your prisma client:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./prisma-client"
}
```

You can choose to revert this and comment out the types generator after exporting your types.
