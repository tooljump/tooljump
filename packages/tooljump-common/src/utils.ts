import { Logger } from "@tooljump/logger";
import { get } from "lodash";

/**
 * Generates a cache key from an array of context paths
 * @param context The context object to extract values from
 * @param cacheKeyPaths Array of paths to extract from context (e.g., ['service.name', 'service.arn'])
 * @param logger Logger instance for warning about missing paths
 * @param integrationName Name of the integration for logging context
 * @returns A cache key string or null if no valid paths found
 */
export function generateCacheKey(
    context: any, 
    cacheKeyPaths: string[], 
    logger: Logger, 
    integrationName: string
): string | null {
    if (!cacheKeyPaths || cacheKeyPaths.length === 0) {
        return null;
    }

    const resolvedValues: string[] = [];
    
    for (const path of cacheKeyPaths) {
        const value = get(context, path);
        
        if (value === undefined) {
            logger.warn(
                { 
                    operation: 'cache-key-generation',
                    integrationName,
                    missingPath: path
                },
                `Cache key path '${path}' not found in context for integration '${integrationName}', using 'undefined'`
            );
            resolvedValues.push('undefined');
        } else {
            resolvedValues.push(String(value));
        }
    }
    
    // Join values with a separator that's unlikely to appear in normal context values
    return resolvedValues.join('|');
}

/**
 * Validates context against match rules
 * @param context The context object to validate
 * @param matchRules The context matching rules from metadata
 * @param logger Logger instance for debug messages
 * @param integrationName Name of the integration for logging context
 * @returns Object with validation result and auto-generated cache key
 */
export function validateContextMatch(
    context: any,
    matchRules: Record<string, any>,
    logger: Logger,
    integrationName: string
): { isValid: boolean; cacheKey: string | null } {
    if (!matchRules || Object.keys(matchRules).length === 0) {
        return { isValid: true, cacheKey: null };
    }

    const contextPaths: string[] = [];
    let isValid = true;

    for (const [path, rule] of Object.entries(matchRules)) {
        const value = get(context, path);
        contextPaths.push(path);

        if (rule.exists === true) {
            if (value === undefined) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        rule: 'exists'
                    },
                    `Context validation failed: path '${path}' does not exist for integration '${integrationName}'`
                );
                isValid = false;
            }
        } else if (rule.exists === false) {
            if (value !== undefined) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        rule: 'exists-false'
                    },
                    `Context validation failed: path '${path}' exists but should not for integration '${integrationName}'`
                );
                isValid = false;
            }
        } else if (rule.equals !== undefined) {
            if (value !== rule.equals) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        expectedValue: rule.equals,
                        actualValue: value,
                        rule: 'equals'
                    },
                    `Context validation failed: path '${path}' value '${value}' does not equal '${rule.equals}' for integration '${integrationName}'`
                );
                isValid = false;
            }
        } else if (rule.in !== undefined) {
            if (!Array.isArray(rule.in) || !rule.in.includes(value)) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        expectedValues: rule.in,
                        actualValue: value,
                        rule: 'in'
                    },
                    `Context validation failed: path '${path}' value '${value}' is not in [${rule.in.join(', ')}] for integration '${integrationName}'`
                );
                isValid = false;
            }
        } else if (rule.pattern !== undefined) {
            if (typeof value !== 'string' || !rule.pattern.test(value)) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        pattern: rule.pattern.toString(),
                        actualValue: value,
                        rule: 'pattern'
                    },
                    `Context validation failed: path '${path}' value '${value}' does not match pattern '${rule.pattern}' for integration '${integrationName}'`
                );
                isValid = false;
            }
        } else if (rule.startsWith !== undefined) {
            if (typeof value !== 'string' || !value.startsWith(rule.startsWith)) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        expectedPrefix: rule.startsWith,
                        actualValue: value,
                        rule: 'startsWith'
                    },
                    `Context validation failed: path '${path}' value '${value}' does not start with '${rule.startsWith}' for integration '${integrationName}'`
                );
                isValid = false;
            }
        } else if (rule.endsWith !== undefined) {
            if (typeof value !== 'string' || !value.endsWith(rule.endsWith)) {
                logger.debug(
                    { 
                        operation: 'context-validation',
                        integrationName,
                        path,
                        expectedSuffix: rule.endsWith,
                        actualValue: value,
                        rule: 'endsWith'
                    },
                    `Context validation failed: path '${path}' value '${value}' does not end with '${rule.endsWith}' for integration '${integrationName}'`
                );
                isValid = false;
            }
        }
    }

    // Auto-generate cache key from context paths
    const cacheKey = isValid && contextPaths.length > 0 
        ? generateCacheKey(context, contextPaths, logger, integrationName)
        : null;

    return { isValid, cacheKey };
} 