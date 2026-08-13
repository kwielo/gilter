import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateFilterId, parseFiltersXml } from '../parser';
import sampleXml from '../../../public/sample.xml?raw';

function feed(entries: string, extra = ''): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns='http://www.w3.org/2005/Atom' xmlns:apps='http://schemas.google.com/apps/2006'>
  <title>Mail Filters</title>
  ${extra}
  ${entries}
</feed>`;
}

function entry(id: string, props: string): string {
  return `<entry>
    <id>${id}</id>
    ${props}
  </entry>`;
}

describe('parseFiltersXml', () => {
  it('parses Gmail sample.xml into filters and feed meta', () => {
    const { meta, filters } = parseFiltersXml(sampleXml);

    expect(meta).toEqual({
      title: 'Mail Filters',
      authorName: 'Krzysztof Wielogórski',
      authorEmail: 'kwielogorski@gmail.com',
    });
    expect(filters).toHaveLength(9);
    expect(filters[0]).toEqual({
      id: 'tag:mail.google.com,2008:filter:1379587164706',
      criteria: { to: '*spam*' },
      actions: { shouldTrash: true, shouldNeverMarkAsImportant: true },
    });
    expect(filters[1].criteria.from).toBe('*booking.com');
    expect(filters[1].actions.smartLabelToApply).toBe('^smartlabel_personal');
    expect(filters[2].criteria.hasAttachment).toBe(true);
    expect(filters[2].actions.forwardTo).toBe('contact@wielo.co');
  });

  it('defaults title and empty author when feed metadata is missing', () => {
    const { meta, filters } = parseFiltersXml(feed(''));
    expect(meta).toEqual({ title: 'Mail Filters', authorName: '', authorEmail: '' });
    expect(filters).toEqual([]);
  });

  it('parses string and boolean criteria and actions', () => {
    const xml = feed(entry('filter-1', `
      <apps:property name='from' value='a@b.com'/>
      <apps:property name='to' value='me@x.com'/>
      <apps:property name='subject' value='Invoice'/>
      <apps:property name='hasTheWord' value='receipt'/>
      <apps:property name='doesNotHaveTheWord' value='promo'/>
      <apps:property name='hasAttachment' value='true'/>
      <apps:property name='shouldArchive' value='true'/>
      <apps:property name='shouldMarkAsRead' value='true'/>
      <apps:property name='forwardTo' value='copy@x.com'/>
    `));

    const { filters } = parseFiltersXml(xml);
    expect(filters[0].criteria).toEqual({
      from: 'a@b.com',
      to: 'me@x.com',
      subject: 'Invoice',
      hasTheWord: 'receipt',
      doesNotHaveTheWord: 'promo',
      hasAttachment: true,
    });
    expect(filters[0].actions).toEqual({
      shouldArchive: true,
      shouldMarkAsRead: true,
      forwardTo: 'copy@x.com',
    });
  });

  it('collects multiple label properties into an array', () => {
    const xml = feed(entry('filter-1', `
      <apps:property name='label' value='Work'/>
      <apps:property name='label' value='Receipts'/>
    `));
    expect(parseFiltersXml(xml).filters[0].actions.label).toEqual(['Work', 'Receipts']);
  });

  it('ignores Gmail meta keys and unknown properties', () => {
    const xml = feed(entry('filter-1', `
      <apps:property name='from' value='a@b.com'/>
      <apps:property name='sizeOperator' value='s_sl'/>
      <apps:property name='sizeUnit' value='s_smb'/>
      <apps:property name='unknownField' value='nope'/>
    `));
    const filter = parseFiltersXml(xml).filters[0];
    expect(filter.criteria).toEqual({ from: 'a@b.com' });
    expect(filter.actions).toEqual({});
    expect(filter).not.toHaveProperty('sizeOperator');
  });

  it('treats boolean properties other than "true" as false', () => {
    const xml = feed(entry('filter-1', `
      <apps:property name='hasAttachment' value='false'/>
      <apps:property name='shouldTrash' value='TRUE'/>
    `));
    const filter = parseFiltersXml(xml).filters[0];
    expect(filter.criteria.hasAttachment).toBe(false);
    expect(filter.actions.shouldTrash).toBe(false);
  });

  it('skips properties with missing name or value', () => {
    const xml = feed(entry('filter-1', `
      <apps:property name='from'/>
      <apps:property value='orphan'/>
      <apps:property name='to' value='kept@x.com'/>
    `));
    expect(parseFiltersXml(xml).filters[0].criteria).toEqual({ to: 'kept@x.com' });
  });

  it('generates an id when an entry has none', () => {
    const xml = feed(`<entry>
      <apps:property name='from' value='a@b.com'/>
    </entry>`);
    const id = parseFiltersXml(xml).filters[0].id;
    expect(id).toMatch(/^tag:mail\.google\.com,2008:filter:z\d+\*\d{16}$/);
  });

  it('throws on invalid XML', () => {
    expect(() => parseFiltersXml('<not valid')).toThrow(/Invalid XML/);
  });
});

describe('generateFilterId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses a timestamp and padded random suffix', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
    expect(generateFilterId()).toBe(
      'tag:mail.google.com,2008:filter:z1700000000000*4200000000000000',
    );
  });
});
