import { describe, expect, it, vi } from 'vitest';
import { downloadAsFile, getXmlFileFromDrop, readFileAsText } from '../file-io';

describe('file-io', () => {
  it('reads a File as text', async () => {
    const file = new File(['<feed/>'], 'mailFilters.xml', { type: 'application/xml' });
    await expect(readFileAsText(file)).resolves.toBe('<feed/>');
  });

  it('returns the first dropped file or null', () => {
    const file = new File(['x'], 'a.xml');
    expect(getXmlFileFromDrop({ dataTransfer: { files: [file] } } as unknown as DragEvent)).toBe(file);
    expect(getXmlFileFromDrop({ dataTransfer: { files: [] } } as unknown as DragEvent)).toBeNull();
    expect(getXmlFileFromDrop({} as DragEvent)).toBeNull();
  });

  it('triggers a download via a temporary anchor', () => {
    const click = vi.fn();
    const originalCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: click });
      }
      return el;
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadAsFile('<feed/>', 'filters.xml');

    expect(click).toHaveBeenCalledOnce();
    const anchor = document.body.querySelector('a');
    expect(anchor?.getAttribute('download')).toBe('filters.xml');
    expect(anchor?.getAttribute('href')).toBe('blob:test');

    createSpy.mockRestore();
    vi.mocked(URL.createObjectURL).mockRestore();
    revoke.mockRestore();
  });
});
