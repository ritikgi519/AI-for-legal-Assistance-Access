import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Accessibility and Semantic HTML Standards', () => {
  it('index.html contains lang attribute, meta description, and theme-color', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    expect(html).toContain('lang="en"');
    expect(html).toContain('name="description"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('content="#020617"');
    expect(html).toContain("Object.defineProperty(window, 'fetch'");
  });

  it('App.tsx contains accessible skip-to-content link and ARIA landmarks', () => {
    const appTsx = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf-8');
    expect(appTsx).toContain('href="#main-content"');
    expect(appTsx).toContain('Skip to main content');
    expect(appTsx).toContain('role="status"');
    expect(appTsx).toContain('aria-live="polite"');
    expect(appTsx).toContain('role="tablist"');
    expect(appTsx).toContain('role="tab"');
    expect(appTsx).toContain('role="tabpanel"');
    expect(appTsx).toContain('role="contentinfo"');
  });

  it('Modals implement role="dialog", aria-modal="true", and aria-labelledby', () => {
    const docModal = fs.readFileSync(path.resolve(__dirname, '../src/components/DocumentModal.tsx'), 'utf-8');
    expect(docModal).toContain('role="dialog"');
    expect(docModal).toContain('aria-modal="true"');
    expect(docModal).toContain('aria-labelledby="doc-modal-title"');
    expect(docModal).toContain('id="doc-modal-title"');
    expect(docModal).toContain('htmlFor="doc-title-input"');
    expect(docModal).toContain('id="doc-title-input"');

    const exportModal = fs.readFileSync(path.resolve(__dirname, '../src/components/ExportModal.tsx'), 'utf-8');
    expect(exportModal).toContain('role="dialog"');
    expect(exportModal).toContain('aria-modal="true"');
    expect(exportModal).toContain('aria-labelledby="export-modal-title"');
    expect(exportModal).toContain('id="export-modal-title"');

    const sourceModal = fs.readFileSync(path.resolve(__dirname, '../src/components/SourceViewerModal.tsx'), 'utf-8');
    expect(sourceModal).toContain('role="dialog"');
    expect(sourceModal).toContain('aria-modal="true"');
    expect(sourceModal).toContain('aria-labelledby="source-modal-title"');
    expect(sourceModal).toContain('id="source-modal-title"');
  });

  it('Header component implements role="banner" and accessible labels', () => {
    const header = fs.readFileSync(path.resolve(__dirname, '../src/components/Header.tsx'), 'utf-8');
    expect(header).toContain('role="banner"');
    expect(header).toContain('aria-label="Analyze new document"');
  });
});
