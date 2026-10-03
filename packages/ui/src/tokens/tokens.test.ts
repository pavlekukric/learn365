import { describe, expect, it } from 'vitest';

import { editorial } from '../themes/editorial.js';
import { modern } from '../themes/modern.js';
import { colorVarName, modernColorOverrides, srgbFallback } from './color.js';

describe('color tokens', () => {
  it('every CSS variable name maps to an existing color token', () => {
    for (const key of Object.keys(colorVarName)) {
      expect(editorial.color).toHaveProperty(key);
    }
  });

  it('modern theme only overrides keys declared in modernColorOverrides', () => {
    for (const [key, editorialValue] of Object.entries(editorial.color)) {
      const modernValue = modern.color[key as keyof typeof modern.color];
      const isOverridden = key in modernColorOverrides;
      if (isOverridden) {
        expect(modernValue).toBe(modernColorOverrides[key as keyof typeof modernColorOverrides]);
      } else {
        expect(modernValue).toBe(editorialValue);
      }
    }
  });

  it('srgb fallback only declares known color tokens', () => {
    for (const key of Object.keys(srgbFallback)) {
      expect(editorial.color).toHaveProperty(key);
    }
  });
});

describe('typography', () => {
  it('reader title has a mobile size override', () => {
    expect(editorial.typeScale.readerTitle.mobile?.size).toBe('30px');
  });

  it('body has a mobile size override', () => {
    expect(editorial.typeScale.body.mobile?.size).toBe('17px');
  });
});

describe('layout invariants', () => {
  it('reading column stays at 660px (premium reader contract)', () => {
    expect(editorial.layout.readingColMax).toBe('660px');
  });

  it('shell caps at 1440px', () => {
    expect(editorial.layout.shellMax).toBe('1440px');
  });
});
