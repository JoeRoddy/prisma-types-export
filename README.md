# prisma-types-export

Export your prisma types files to a local directory, to share across multiple projects / repositories / machines.

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

**Note about monorepos**:

If you are using a monorepo like pnpm workspaces, you may need to add a custom output location to your prisma client:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./prisma-client"
}
```

You can revert this and comment out the types generator after generating your types files.
