import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { getSafeFileExt, uploadBufferToCos } from '@/lib/tencentCos';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_EXTS = new Set(['pdf', 'txt']);
const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
]);

function createObjectKey(fileName: string) {
  const ext = getSafeFileExt(fileName);
  const date = new Date().toISOString().slice(0, 10);
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now()}${Math.random().toString(36).slice(2)}`;

  return `resume-agent/uploads/${date}/${random}.${ext}`;
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function extractResumeText(file: File, buffer: Buffer, ext: string) {
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (ext === 'txt' || file.type === 'text/plain') {
    return buffer.toString('utf8').trim();
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请选择要上传的简历文件' }, { status: 400 });
    }

    const ext = getSafeFileExt(file.name);
    const isSupported =
      SUPPORTED_EXTS.has(ext) || (file.type ? SUPPORTED_MIME_TYPES.has(file.type) : false);

    if (!isSupported) {
      return NextResponse.json(
        { error: '当前支持 PDF / TXT 简历上传，Word 文件请先导出为 PDF' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: '简历文件不能超过 20MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = createObjectKey(file.name);
    const [uploadResult, resumeText] = await Promise.all([
      uploadBufferToCos({
        key,
        body: buffer,
        contentType: file.type || 'application/octet-stream',
      }),
      extractResumeText(file, buffer, ext),
    ]);

    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json(
        {
          error: '文件已上传，但没有提取到足够的简历文本。请确认 PDF 可复制文本，或手动粘贴内容。',
          file: {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            cosKey: uploadResult.key,
            cosUrl: uploadResult.url,
          },
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      file: {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        cosKey: uploadResult.key,
        cosUrl: uploadResult.url,
      },
      resumeText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '简历上传失败';
    const status = message.includes('腾讯云 COS 配置') ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
