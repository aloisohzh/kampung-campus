'use client';
import { suggestSkills } from './profile-details';
const MAX_TEXT = 60000;
export async function readCV(
  file: File,
): Promise<{ text: string; skills: string[]; note: string }> {
  const extension = file.name.split('.').at(-1)?.toLowerCase();
  let text = '';
  let partial = false;
  if (extension === 'txt') text = (await file.text()).slice(0, MAX_TEXT);
  else if (extension === 'docx') {
    const { unzipSync, strFromU8 } = await import('fflate');
    const contents = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) =>
        entry.name === 'word/document.xml' && entry.originalSize <= 2_000_000,
    });
    if (!contents['word/document.xml'])
      throw new Error(
        'This Word file could not be read. Try a PDF or text file.',
      );
    const document = new DOMParser().parseFromString(
      strFromU8(contents['word/document.xml']),
      'application/xml',
    );
    text = Array.from(document.getElementsByTagName('w:t'))
      .map((node) => node.textContent)
      .join(' ')
      .slice(0, MAX_TEXT);
  } else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({
      data: await file.arrayBuffer(),
      useSystemFonts: true,
    });
    const timeout = setTimeout(() => {
      void task.destroy();
    }, 20000);
    try {
      const document = await task.promise;
      partial = document.numPages > 15;
      for (
        let page = 1;
        page <= Math.min(document.numPages, 15) && text.length < MAX_TEXT;
        page++
      ) {
        const content = await (await document.getPage(page)).getTextContent();
        text +=
          content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ') + '\n';
      }
    } finally {
      clearTimeout(timeout);
      await task.destroy();
    }
  } else throw new Error('Choose a PDF, DOCX or TXT CV.');
  const skills = suggestSkills(text);
  return {
    text: text.slice(0, MAX_TEXT),
    skills,
    note: text.trim()
      ? (partial ? 'Suggestions use the first 15 pages. ' : '') +
        'Suggestions match text in your document. Review them before saving.'
      : 'No readable text was found. You can still save the document and add skills in Profile setup.',
  };
}
