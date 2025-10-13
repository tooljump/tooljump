import { describe, it, expect } from 'vitest';
import { AWSAdapter } from './aws';

describe('AWSAdapter', () => {
  const adapter = new AWSAdapter();

  it('getContextType returns aws', () => {
    expect(adapter.getContextType()).toBe('aws');
  });

  it('getStyle returns expected shape', () => {
    const style = adapter.getStyle();
    expect(style).toMatchObject({
      position: 'static',
      display: 'block',
      zIndex: 99999,
    });
  });
});

