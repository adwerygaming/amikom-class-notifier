import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import tags from "./Tags.js";

// Schema for .env file,
// Make sure to sync this to .env file.
// Default value are: z.string()
const envSchema = z.object({
    NODE_ENV: z.enum(["PROD", "DEV"]).optional(),
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Assuming you place the .env file in the root
config({ path: resolve(__dirname, "../../.env") });

const envParsed = envSchema.safeParse(process.env)

if (envParsed.error) {
    const missingVars = Object.entries(envParsed.error.flatten()?.fieldErrors ?? {})
        .filter(([, errors]) => errors.length > 0)
        .map(([key,]) => `${key}=`)

    console.log(`[${tags.Error}] Missing environment variables:\n${missingVars.join("\n")}`)
    throw new Error(`Please check your .env file again and make sure all required variables are set.`)
}

if (Object.keys(envParsed?.data ?? {}).length == 0) {
    console.log(`[${tags.Error}] No environment variables found.`)
    throw new Error(`No environment variables found. Please check your .env file.`)
}

if (envParsed.success) {
    console.log(`[${tags.System}] Environment Variable Check Success.`)
}

export const env = envParsed.data
