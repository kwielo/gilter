import { load } from '../filter-store';
import { clearHistory } from '../history';
import { deselectAll } from '../selection';
import { setLabels } from '../label-cache';

const EMPTY_META = { title: 'Mail Filters', authorName: '', authorEmail: '' };

export function resetStoreState(): void {
  load(EMPTY_META, []);
  clearHistory();
  deselectAll();
  setLabels([]);
}
