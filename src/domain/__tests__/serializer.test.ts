import { describe, expect, it } from 'vitest';
import { parseFiltersXml } from '../parser';
import { serializeFiltersXml } from '../serializer';
import { emptyMeta, makeFilter, sampleMeta } from './fixtures';

describe('serializeFiltersXml', () => {
  it('emits a Gmail-compatible feed with author, ids, and properties', () => {
    const xml = serializeFiltersXml(sampleMeta, [
      makeFilter({
        id: 'tag:mail.google.com,2008:filter:z1',
        criteria: { from: 'a@b.com', hasAttachment: true },
        actions: { shouldArchive: true, label: ['Work', 'Receipts'] },
      }),
    ]);

    expect(xml).toContain("<?xml version='1.0' encoding='UTF-8'?>");
    expect(xml).toContain("xmlns='http://www.w3.org/2005/Atom'");
    expect(xml).toContain("xmlns:apps='http://schemas.google.com/apps/2006'");
    expect(xml).toContain('<title>Mail Filters</title>');
    expect(xml).toContain('<name>Ada Lovelace</name>');
    expect(xml).toContain('<email>ada@example.com</email>');
    expect(xml).toContain('<id>tag:mail.google.com,2008:filters:z1</id>');
    expect(xml).toContain("<apps:property name='from' value='a@b.com'/>");
    expect(xml).toContain("<apps:property name='hasAttachment' value='true'/>");
    expect(xml).toContain("<apps:property name='shouldArchive' value='true'/>");
    expect(xml).toContain("<apps:property name='label' value='Work'/>");
    expect(xml).toContain("<apps:property name='label' value='Receipts'/>");
    expect(xml).toContain("<apps:property name='sizeOperator' value='s_sl'/>");
    expect(xml).toContain("<apps:property name='sizeUnit' value='s_smb'/>");
  });

  it('omits author when name and email are empty', () => {
    const xml = serializeFiltersXml(emptyMeta, []);
    expect(xml).not.toContain('<author>');
  });

  it('defaults a missing title to Mail Filters', () => {
    const xml = serializeFiltersXml({ title: '', authorName: '', authorEmail: '' }, []);
    expect(xml).toContain('<title>Mail Filters</title>');
  });

  it('skips empty, false, and undefined values', () => {
    const xml = serializeFiltersXml(emptyMeta, [
      makeFilter({
        criteria: { from: '', subject: 'Hi', hasAttachment: false },
        actions: { shouldTrash: false, forwardTo: undefined },
      }),
    ]);
    expect(xml).toContain("<apps:property name='subject' value='Hi'/>");
    expect(xml).not.toContain("name='from'");
    expect(xml).not.toContain("name='hasAttachment'");
    expect(xml).not.toContain("name='shouldTrash'");
    expect(xml).not.toContain("name='forwardTo'");
  });

  it('escapes XML special characters in text and attributes', () => {
    const xml = serializeFiltersXml(
      { title: 'A & B <C>', authorName: "O'Reilly", authorEmail: 'a@b.com' },
      [makeFilter({ criteria: { subject: `Quote "hi" & <tag>` } })],
    );
    expect(xml).toContain('<title>A &amp; B &lt;C&gt;</title>');
    expect(xml).toContain("<name>O&apos;Reilly</name>");
    expect(xml).toContain(`value='Quote &quot;hi&quot; &amp; &lt;tag&gt;'`);
  });

  it('round-trips filters through serialize then parse', () => {
    const original = [
      makeFilter({
        id: 'tag:mail.google.com,2008:filter:abc',
        criteria: {
          from: 'a@b.com',
          to: 'me@x.com',
          subject: 'Hello & goodbye',
          hasTheWord: 'invoice',
          doesNotHaveTheWord: 'promo',
          hasAttachment: true,
        },
        actions: {
          shouldTrash: true,
          shouldArchive: true,
          shouldMarkAsRead: true,
          shouldNeverSpam: true,
          shouldAlwaysMarkAsImportant: true,
          forwardTo: 'copy@x.com',
          label: ['Work', 'Finance'],
          smartLabelToApply: '^smartlabel_personal',
        },
      }),
    ];

    const xml = serializeFiltersXml(sampleMeta, original);
    const parsed = parseFiltersXml(xml);

    expect(parsed.meta).toEqual(sampleMeta);
    expect(parsed.filters).toEqual(original);
  });
});
