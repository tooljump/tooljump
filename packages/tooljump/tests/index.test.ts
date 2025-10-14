import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolJump } from '../src/index';
import type { Request, Response } from 'express';

// Mock helper functions
function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, debug, info, warn, error, child };
}

function createMockSecrets() {
  return {
    load: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue('mock-secret')
  } as any;
}

function createMockIntegrations() {
  return {
    load: vi.fn().mockResolvedValue(undefined),
    getIntegrations: vi.fn().mockResolvedValue([]),
    getIntegrationsByContext: vi.fn().mockResolvedValue([]),
    getDataFiles: vi.fn().mockResolvedValue([])
  } as any;
}

function createMockRunner() {
  return {
    run: vi.fn().mockResolvedValue([{ type: 'text', content: 'test result' }])
  } as any;
}

function createMockCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined)
  } as any;
}

function createMockAuth() {
  return {
    middleware: vi.fn((req: any, res: any, next: any) => next())
  } as any;
}

function createMockConfig(allowedAdapters: string[] = ['github', 'aws', 'generic']) {
  return {
    allowedAdapters,
    adapters: {
      github: { urls: ['https://github.com'] },
      aws: { urls: ['https://console.aws.amazon.com'] },
      generic: { urls: [/^https:\/\/.*/] }
    }
  } as any;
}

function createMockRequest(body: any = {}, headers: any = {}): Request {
  return {
    body,
    headers,
    get: vi.fn((header: string) => headers[header]),
    path: '/context'
  } as any;
}

function createMockResponse(): Response {
  const json = vi.fn();
  const send = vi.fn();
  const status = vi.fn(() => ({ json, send, status }) as any);
  return { json, send, status } as any;
}

describe('ToolJump constructor', () => {
  it('initializes with all required dependencies', () => {
    const { logger } = createMockLogger();
    const config = {
      logger,
      secrets: createMockSecrets(),
      integrations: createMockIntegrations(),
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig()
    };

    const toolJump = new ToolJump(config);
    expect(toolJump).toBeTruthy();
  });

  it('creates a child logger with component name', () => {
    const { logger, child } = createMockLogger();
    const config = {
      logger,
      secrets: createMockSecrets(),
      integrations: createMockIntegrations(),
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig()
    };

    new ToolJump(config);
    expect(child).toHaveBeenCalledWith({ component: 'tooljump' });
  });
});

describe('ToolJump handleContext validation', () => {
  let toolJump: ToolJump;
  let mockIntegrations: any;

  beforeEach(() => {
    const { logger } = createMockLogger();
    mockIntegrations = createMockIntegrations();
    
    const config = {
      logger,
      secrets: createMockSecrets(),
      integrations: mockIntegrations,
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig(['github', 'aws', 'generic'])
    };

    toolJump = new ToolJump(config);
  });

  it('accepts valid request with required fields', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    // Access the private method through type assertion
    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(mockIntegrations.getIntegrationsByContext).toHaveBeenCalled();
  });

  it('rejects request with invalid adapter type', async () => {
    const req = createMockRequest({
      type: 'invalid',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    await (toolJump as any).handleContext(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'type'
          })
        ])
      })
    );
  });

  it('rejects request with missing type field', async () => {
    const req = createMockRequest({
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    await (toolJump as any).handleContext(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'type'
          })
        ])
      })
    );
  });

  it('rejects request with missing url field', async () => {
    const req = createMockRequest({
      type: 'github'
    });
    const res = createMockResponse();

    await (toolJump as any).handleContext(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'url'
          })
        ])
      })
    );
  });

  it('rejects request with invalid url format', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'not-a-valid-url'
    });
    const res = createMockResponse();

    await (toolJump as any).handleContext(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'url',
            message: expect.stringContaining('URL')
          })
        ])
      })
    );
  });

  it('accepts additional string fields', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo',
      branch: 'main',
      author: 'user123'
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(mockIntegrations.getIntegrationsByContext).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'github',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        author: 'user123'
      })
    );
  });

  it('accepts additional number fields', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo',
      issueNumber: 123,
      prNumber: 456
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('accepts additional boolean fields', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo',
      isPrivate: true,
      hasIssues: false
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('accepts nested objects up to 10 levels', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo',
      nested: {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    level7: {
                      level8: {
                        level9: {
                          level10: 'deep value'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('accepts arrays of primitives', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo',
      tags: ['tag1', 'tag2', 'tag3'],
      numbers: [1, 2, 3],
      flags: [true, false, true]
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('accepts null values', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo',
      optionalField: null
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('validates adapter types dynamically based on config', async () => {
    const { logger } = createMockLogger();
    const limitedConfig = {
      logger,
      secrets: createMockSecrets(),
      integrations: mockIntegrations,
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig(['github']) // Only github allowed
    };

    const limitedToolJump = new ToolJump(limitedConfig);

    const req = createMockRequest({
      type: 'aws', // Not in allowed list
      url: 'https://console.aws.amazon.com'
    });
    const res = createMockResponse();

    await (limitedToolJump as any).handleContext(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid request body'
      })
    );
  });
});

describe('ToolJump handleContext integration execution', () => {
  let toolJump: ToolJump;
  let mockIntegrations: any;
  let mockRunner: any;
  let mockCache: any;

  beforeEach(() => {
    const { logger } = createMockLogger();
    mockIntegrations = createMockIntegrations();
    mockRunner = createMockRunner();
    mockCache = createMockCache();
    
    const config = {
      logger,
      secrets: createMockSecrets(),
      integrations: mockIntegrations,
      runner: mockRunner,
      cache: mockCache,
      auth: createMockAuth(),
      config: createMockConfig()
    };

    toolJump = new ToolJump(config);
  });

  it('returns empty response when no integrations match', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([]);

    await (toolJump as any).handleContext(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 0,
        cacheHits: 0,
        failedCount: 0,
        data: []
      })
    );
  });

  it('executes integrations and returns results', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    const mockIntegration = {
      metadata: {
        name: 'test-integration',
        cache: 300
      }
    };

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([mockIntegration]);
    mockIntegrations.getDataFiles.mockResolvedValue([]);
    mockRunner.run.mockResolvedValue([
      { type: 'text', content: 'Test result', status: 'success' }
    ]);

    await (toolJump as any).handleContext(req, res);

    expect(mockRunner.run).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            content: 'Test result',
            status: 'success'
          })
        ])
      })
    );
  });

  it('uses cache when available', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    const mockIntegration = {
      metadata: {
        name: 'test-integration',
        cache: 300,
        cacheKey: ['url']
      }
    };

    const cachedResult = [{ type: 'text', content: 'Cached result', status: 'success' }];

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([mockIntegration]);
    mockCache.get.mockResolvedValue(cachedResult);

    await (toolJump as any).handleContext(req, res);

    expect(mockRunner.run).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            content: 'Cached result',
            status: 'success'
          })
        ])
      })
    );
  });

  it('caches results after execution', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    const mockIntegration = {
      metadata: {
        name: 'test-integration',
        cache: 300,
        cacheKey: ['url']
      }
    };

    const result = [{ type: 'text', content: 'Fresh result', status: 'success' }];

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([mockIntegration]);
    mockIntegrations.getDataFiles.mockResolvedValue([]);
    mockCache.get.mockResolvedValue(null);
    mockRunner.run.mockResolvedValue(result);

    await (toolJump as any).handleContext(req, res);

    expect(mockCache.set).toHaveBeenCalledWith(
      expect.any(String),
      result,
      300
    );
  });

  it('handles integration execution errors gracefully', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    const mockIntegration = {
      metadata: {
        name: 'failing-integration',
        cache: 300
      }
    };

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([mockIntegration]);
    mockIntegrations.getDataFiles.mockResolvedValue([]);
    mockRunner.run.mockRejectedValue(new Error('Integration execution failed'));

    await (toolJump as any).handleContext(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        failedCount: 1,
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            status: 'important',
            content: expect.stringContaining('failing-integration')
          })
        ])
      })
    );
  });

  it('validates integration results with Zod schema', async () => {
    const req = createMockRequest({
      type: 'github',
      url: 'https://github.com/owner/repo'
    });
    const res = createMockResponse();

    const mockIntegration = {
      metadata: {
        name: 'invalid-result-integration',
        cache: 300
      }
    };

    mockIntegrations.getIntegrationsByContext.mockResolvedValue([mockIntegration]);
    mockIntegrations.getDataFiles.mockResolvedValue([]);
    // Return invalid result format
    mockRunner.run.mockResolvedValue([
      { type: 'invalid-type', content: 'test' }
    ]);

    await (toolJump as any).handleContext(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            status: 'important',
            content: expect.stringContaining('failed, check logs')
          })
        ])
      })
    );
  });
});

describe('ToolJump handleCustomDomains', () => {
  let toolJump: ToolJump;
  let mockIntegrations: any;

  beforeEach(() => {
    const { logger } = createMockLogger();
    mockIntegrations = createMockIntegrations();
    
    const config = {
      logger,
      secrets: createMockSecrets(),
      integrations: mockIntegrations,
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig()
    };

    toolJump = new ToolJump(config);
  });

  it('returns custom domains from integrations', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    const mockIntegration = {
      metadata: {
        name: 'custom-integration',
        contextType: 'generic',
        match: {
          contextType: 'generic',
          context: {
            url: { startsWith: 'https://custom.domain.com' }
          }
        }
      }
    };

    mockIntegrations.getIntegrations.mockResolvedValue([mockIntegration]);

    await (toolJump as any).handleCustomDomains(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        hosts: expect.arrayContaining(['https://custom.domain.com']),
        count: expect.any(Number)
      })
    );
  });

  it('handles errors gracefully by returning empty array', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    mockIntegrations.getIntegrations.mockRejectedValue(new Error('Failed to load'));

    await (toolJump as any).handleCustomDomains(req, res);

    // getIntegrationHosts catches errors internally and returns empty array
    // so handleCustomDomains should succeed with empty hosts
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        hosts: [],
        count: 0
      })
    );
  });
});

describe('ToolJump handleConfig', () => {
  let toolJump: ToolJump;
  let mockIntegrations: any;

  beforeEach(() => {
    const { logger } = createMockLogger();
    mockIntegrations = createMockIntegrations();
    
    const config = {
      logger,
      secrets: createMockSecrets(),
      integrations: mockIntegrations,
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig(['github', 'aws'])
    };

    toolJump = new ToolJump(config);
  });

  it('returns adapter configuration', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    mockIntegrations.getIntegrations.mockResolvedValue([]);

    await (toolJump as any).handleConfig(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        adapters: expect.arrayContaining([
          expect.objectContaining({
            name: 'github',
            enabled: true
          }),
          expect.objectContaining({
            name: 'aws',
            enabled: true
          }),
          expect.objectContaining({
            name: 'generic',
            enabled: false
          })
        ])
      })
    );
  });
});

describe('ToolJump start', () => {
  it('loads secrets and integrations on startup', async () => {
    const { logger } = createMockLogger();
    const mockSecrets = createMockSecrets();
    const mockIntegrations = createMockIntegrations();
    
    const config = {
      logger,
      secrets: mockSecrets,
      integrations: mockIntegrations,
      runner: createMockRunner(),
      cache: createMockCache(),
      auth: createMockAuth(),
      config: createMockConfig()
    };

    const toolJump = new ToolJump(config);

    // Mock express app.listen
    const mockListen = vi.fn((port, callback) => callback());
    (toolJump as any).app.listen = mockListen;

    await toolJump.start(3000);

    expect(mockSecrets.load).toHaveBeenCalled();
    expect(mockIntegrations.load).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});

