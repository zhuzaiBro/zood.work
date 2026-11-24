import { cp } from 'node:fs/promises'

const maps = new URL('./cmaps/', import.meta.resolve('pdfjs-dist/package.json'))
await cp(maps, new URL('../public/resume-cmaps/', import.meta.url), { recursive: true })
