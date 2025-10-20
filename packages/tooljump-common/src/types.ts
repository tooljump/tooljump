import { z } from "zod";

// Note: Auth and Cache are now base classes exported from Auth.ts and Cache.ts

export const metadataSchema = z.object({
    name: z.string().max(100).regex(/^[a-z][a-z0-9_-]{3,}$/, {
        message: "Must start with a lowercase letter and contain only a-z, 0-9, and _.",
    }),
    description: z.string().max(500).optional(),
    match: z.object({
        contextType: z.string().max(100).refine((val) => val === '*' || /^[a-z][a-z0-9_-]{1,}$/.test(val), {
            message: "Must be '*' or start with a lowercase letter and contain only a-z, 0-9, and _.",
        }),
        context: z.record(z.string(), z.union([
            z.object({ exists: z.boolean() }).passthrough(),
            z.object({ equals: z.any() }).passthrough(),
            z.object({ in: z.array(z.any()) }).passthrough(),
            z.object({ pattern: z.instanceof(RegExp) }).passthrough(),
            z.object({ startsWith: z.string().max(200) }).passthrough(),
            z.object({ endsWith: z.string().max(200) }).passthrough()
        ])).optional().default({})
    }),
    cache: z.number().min(0).max(3600 * 24 * 30).default(300),
    requiredSecrets: z.array(z.string().min(2).max(100)).optional().default([]),
    cacheKey: z.array(z.string().min(2).max(100)).optional(),
    priority: z.number().min(1).max(1000).default(100),
});

type Metadata = z.infer<typeof metadataSchema>;

export type Integration = {
    id: string;
    code: string;
    metadata: Metadata;
};

// Result validation schemas
export const DropdownItemSchema = z.object({
  content: z.string(),
  href: z.string(),
  status: z.enum(['important', 'relevant', 'success', 'none']).optional(),
  icon: z.string().optional(),
  tooltip: z.string().min(1).max(500).optional(),
});

export const ResultSchema = z.object({
  type: z.enum(['text', 'link', 'dropdown']),
  content: z.string(),
  href: z.string().optional(),
  status: z.enum(['important', 'relevant', 'success', 'none']).optional(),
  icon: z.string().optional(),
  tooltip: z.string().min(1).max(500).optional(),
  items: z.array(DropdownItemSchema).optional(),
}).refine((data) => {
  // If type is dropdown, items must be present
  if (data.type === 'dropdown' && !data.items) {
    return false;
  }
  return true;
}, {
  message: "Dropdown type requires items array",
  path: ["items"]
});

export const ResultsArraySchema = z.array(ResultSchema);

// TypeScript types inferred from Zod schemas
export type DropdownItem = z.infer<typeof DropdownItemSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type ResultsArray = z.infer<typeof ResultsArraySchema>;

export type { Metadata }; 