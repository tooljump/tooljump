import { z } from 'zod';

// Schema for URL patterns (string or RegExp)
const UrlPatternSchema = z.union([
    z.string().url(),
    z.instanceof(RegExp)
]);

// Schema for adapter configuration
const AdapterConfigSchema = z.object({
    urls: z.array(UrlPatternSchema)
});

// Schema for rate limiting configuration
const RateLimitSchema = z.object({
    windowMs: z.number().optional().default(15 * 60 * 1000), // 15 minutes in seconds
    max: z.number().optional().default(200)
});

// Schema for the entire configuration
export const ConfigSchema = z.object({
    adapters: z.record(z.string(), AdapterConfigSchema),
    allowedAdapters: z.array(z.string()),
    ratelimit: RateLimitSchema.optional()
}).refine(
    (data) => {
        const adapterKeys = Object.keys(data.adapters);
        return data.allowedAdapters.every(adapter => adapterKeys.includes(adapter));
    },
    {
        message: "All allowedAdapters must be present as keys in the adapters object",
        path: ["allowedAdapters"]
    }
);

// Type inference from the schema
export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
    adapters: {
        "aws": {
            "urls": [
                'https://console.aws.com',
                /\.console\.aws\.amazon\.com$/,
            ]
        },
        "github": {
            "urls": [
                'https://github.com',
            ]
        },
        "generic": {
            "urls": [],
        }
    },
    allowedAdapters: [
        "aws",
        "github",
        "generic",
    ],
    ratelimit: {
        windowMs: 15 * 60, // 15 minutes in seconds
        max: 200
    }
}