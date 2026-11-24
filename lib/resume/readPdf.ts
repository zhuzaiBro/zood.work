import { PDFParse } from 'pdf-parse'

PDFParse.setWorker(new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString())

export async function readPdf(file: File) {
  const parser = new PDFParse({
    data: await file.arrayBuffer(), isEvalSupported: false,
    cMapUrl: new URL('/resume-cmaps/', window.location.origin).href, cMapPacked: true,
  })
  try {
    const { text } = await parser.getText({ pageJoiner: '\n\n' })
    // Embedded CJK fonts sometimes map ordinary characters to compatibility radicals.
    return text.replace(/[\u2e80-\u2fdf\uf900-\ufaff]/gu, char => char.normalize('NFKC'))
  } finally {
    await parser.destroy()
  }
}
