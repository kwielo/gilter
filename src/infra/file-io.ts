/**
 * File import / export helpers.
 *
 * Strategy-style API for reading XML from different sources
 * (file input, drag-drop, clipboard) and triggering browser downloads.
 */

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function getXmlFileFromDrop(event: DragEvent): File | null {
  const files = event.dataTransfer?.files;
  if (!files?.length) return null;
  return files[0];
}

export function downloadAsFile(
  content: string,
  filename: string,
  mime = 'application/xml',
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}
