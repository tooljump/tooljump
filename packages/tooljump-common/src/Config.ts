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

// Schema for the entire configuration
export const ConfigSchema = z.object({
    adapters: z.record(z.string(), AdapterConfigSchema),
    allowedAdapters: z.array(z.string())
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
                /\.console.aws.amazon.com$/,
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
    ]
}