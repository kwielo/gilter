/**
 * Import panel component.
 *
 * Supports three import strategies:
 *   1. File input (<input type="file">)
 *   2. Drag-and-drop
 *   3. Paste XML text
 */

import { Component } from './component';
import { parseFiltersXml } from '../domain/parser';
import { readFileAsText, getXmlFileFromDrop } from '../infra/file-io';
import * as store from '../store/filter-store';
import { emit, Events } from '../store/event-bus';
import { toast } from './toast';

export class ImportPanel extends Component {
  constructor() {
    super('section', 'import-panel');
    this.render();
    this.bind();
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="import-panel__drop-zone" id="drop-zone">
        <div class="import-panel__drop-content">
          <svg class="import-panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>Drop <code>mailFilters.xml</code> here, or</p>
          <label class="btn btn--primary import-panel__file-label">
            Choose file
            <input type="file" accept=".xml,text/xml,application/xml" class="import-panel__file-input" />
          </label>
        </div>
      </div>
      <details class="import-panel__paste">
        <summary>Or paste XML</summary>
        <textarea class="import-panel__textarea" rows="6"
                  placeholder="Paste your Gmail filters XML here..."></textarea>
        <button class="btn btn--secondary import-panel__parse-btn">Parse</button>
      </details>
    `;
  }

  private bind(): void {
    const dropZone  = this.el.querySelector<HTMLElement>('#drop-zone')!;
    const fileInput = this.el.querySelector<HTMLInputElement>('.import-panel__file-input')!;
    const textarea  = this.el.querySelector<HTMLTextAreaElement>('.import-panel__textarea')!;
    const parseBtn  = this.el.querySelector<HTMLButtonElement>('.import-panel__parse-btn')!;

    this.listen(fileInput, 'change', async () => {
      const file = fileInput.files?.[0];
      if (file) await this.importFile(file);
      fileInput.value = '';
    });

    this.listen(dropZone, 'dragover', (e: Event) => {
      e.preventDefault();
      dropZone.classList.add('import-panel__drop-zone--active');
    });
    this.listen(dropZone, 'dragleave', () => {
      dropZone.classList.remove('import-panel__drop-zone--active');
    });
    this.listen(dropZone, 'drop', async (e: Event) => {
      e.preventDefault();
      dropZone.classList.remove('import-panel__drop-zone--active');
      const file = getXmlFileFromDrop(e as DragEvent);
      if (file) await this.importFile(file);
    });

    this.listen(parseBtn, 'click', () => {
      const xml = textarea.value.trim();
      if (!xml) { toast.error('Paste XML first'); return; }
      this.importXml(xml);
      textarea.value = '';
    });
  }

  private async importFile(file: File): Promise<void> {
    try {
      const xml = await readFileAsText(file);
      this.importXml(xml);
    } catch (err) {
      toast.error(`Failed to read file: ${(err as Error).message}`);
    }
  }

  private importXml(xml: string): void {
    try {
      const { meta, filters } = parseFiltersXml(xml);
      store.load(meta, filters);
      emit(Events.IMPORT_SUCCESS, { count: filters.length });
      toast.success(`Imported ${filters.length} filter(s)`);
    } catch (err) {
      emit(Events.IMPORT_ERROR, { error: err });
      toast.error(`Parse error: ${(err as Error).message}`);
    }
  }
}
