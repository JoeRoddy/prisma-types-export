import { PrismaClient } from './prisma/prisma-types';

const prisma = {} as PrismaClient;

prisma.blog
  .findFirst({
    where: {
      title: {
        contains: 'hello',
      },
    },
    select: {
      title: true,
      // body: true,
    },
  })
  .then((res) => {
    console.log(res?.title);
  });
