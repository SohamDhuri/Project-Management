import dotenv from 'dotenv';
dotenv.config();
import { defineConfig } from 'prisma/config';

console.log("DB URL:", process.env.DATABASE_URL);

export default defineConfig(
    {
    schema: 'prisma/schema.prisma',
    datasource: {
        url: "postgresql://neondb_owner:npg_Zm3whc4QtJSN@ep-wispy-thunder-a1bssgk4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
    });

console.log("DB URL:", process.env.DATABASE_URL);