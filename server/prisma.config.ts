import { defineConfig } from 'prisma/config';

export default defineConfig(
    {
    schema: 'prisma/schema.prisma',
    datasource: {
        url: "postgresql://neondb_owner:npg_Zm3whc4QtJSN@ep-wispy-thunder-a1bssgk4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
    });

