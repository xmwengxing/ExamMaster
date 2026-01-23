/**
 * 环境配置验证测试
 * 验证所有必要的依赖是否正确安装
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('环境配置验证', () => {
  it('应该能够导入 vitest', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('应该能够导入 fast-check', () => {
    expect(fc).toBeDefined();
    expect(fc.assert).toBeDefined();
    expect(fc.property).toBeDefined();
  });

  it('应该能够导入 pg (node-postgres)', async () => {
    const { default: pg } = await import('pg');
    expect(pg).toBeDefined();
    expect(pg.Pool).toBeDefined();
    expect(pg.Client).toBeDefined();
  });

  it('fast-check 应该能够生成随机数据', () => {
    fc.assert(
      fc.property(fc.integer(), (num) => {
        expect(typeof num).toBe('number');
        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('fast-check 应该能够生成随机字符串', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(typeof str).toBe('string');
        return true;
      }),
      { numRuns: 10 }
    );
  });
});
