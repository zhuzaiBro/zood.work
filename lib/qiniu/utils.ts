import { QiniuTokenResponse, QiniuUploadResponse } from '@/types/qiniu';

/**
 * 七牛云工具函数
 */

/**
 * 获取上传凭证
 */
export async function getUploadToken(
  filename?: string,
  expireSeconds?: number
): Promise<QiniuTokenResponse> {
  const response = await fetch('/api/upload/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename,
      expireSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error('获取上传凭证失败');
  }

  return response.json();
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${randomStr}.${ext}`;
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, accept: string): boolean {
  if (!accept) return true;

  const acceptTypes = accept.split(',').map((type) => type.trim());
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return acceptTypes.some((acceptType) => {
    // 处理 MIME 类型 (如 image/*, image/png)
    if (acceptType.includes('/')) {
      if (acceptType.endsWith('/*')) {
        const category = acceptType.split('/')[0];
        return fileType.startsWith(category + '/');
      }
      return fileType === acceptType;
    }
    
    // 处理文件扩展名 (如 .jpg, .png)
    if (acceptType.startsWith('.')) {
      return fileName.endsWith(acceptType.toLowerCase());
    }

    return false;
  });
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * 判断是否为图片文件
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const ext = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * 判断是否为视频文件
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
  const ext = getFileExtension(filename).toLowerCase();
  return videoExtensions.includes(ext);
}

/**
 * 判断是否为音频文件
 */
export function isAudioFile(filename: string): boolean {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
  const ext = getFileExtension(filename).toLowerCase();
  return audioExtensions.includes(ext);
}

/**
 * 计算文件哈希值 (用于断点续传)
 */
export async function calculateFileHash(file: File): Promise<string> {
  const chunkSize = 1024 * 1024; // 1MB
  const chunks = Math.ceil(file.size / chunkSize);
  let hash = '';

  for (let i = 0; i < Math.min(chunks, 10); i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hash += hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  return hash.substring(0, 32);
}

/**
 * 构建完整的文件URL
 */
export function buildFileUrl(key: string, domain: string): string {
  const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${cleanDomain}/${cleanKey}`;
}

/**
 * 添加图片处理参数
 * @example
 * addImageProcess('https://domain.com/image.jpg', { w: 800, h: 600 })
 * // 返回: 'https://domain.com/image.jpg?imageView2/2/w/800/h/600'
 */
export function addImageProcess(
  url: string,
  options: {
    w?: number; // 宽度
    h?: number; // 高度
    q?: number; // 质量 (1-100)
    format?: 'jpg' | 'png' | 'webp' | 'gif'; // 格式
  }
): string {
  const params: string[] = ['imageView2/2'];

  if (options.w) params.push(`w/${options.w}`);
  if (options.h) params.push(`h/${options.h}`);
  if (options.q) params.push(`q/${options.q}`);
  if (options.format) params.push(`format/${options.format}`);

  return `${url}?${params.join('/')}`;
}

/**
 * 添加水印
 */
export function addWatermark(
  url: string,
  watermarkUrl: string,
  options?: {
    gravity?: 'NorthWest' | 'North' | 'NorthEast' | 'West' | 'Center' | 'East' | 'SouthWest' | 'South' | 'SouthEast';
    dx?: number;
    dy?: number;
  }
): string {
  const encodedWatermark = btoa(watermarkUrl);
  let params = `watermark/1/image/${encodedWatermark}`;

  if (options?.gravity) params += `/gravity/${options.gravity}`;
  if (options?.dx !== undefined) params += `/dx/${options.dx}`;
  if (options?.dy !== undefined) params += `/dy/${options.dy}`;

  return `${url}?${params}`;
}

/**
 * 获取视频封面
 */
export function getVideoThumbnail(
  videoUrl: string,
  options?: {
    offset?: number; // 截图时间点（秒）
    w?: number; // 宽度
    h?: number; // 高度
    format?: 'jpg' | 'png';
  }
): string {
  const params: string[] = [];
  
  params.push(`vframe/${options?.format || 'jpg'}`);
  if (options?.offset) params.push(`offset/${options.offset}`);
  if (options?.w) params.push(`w/${options.w}`);
  if (options?.h) params.push(`h/${options.h}`);

  return `${videoUrl}?${params.join('/')}`;
}

/**
 * 上传文件到七牛云（封装的便捷方法）
 */
export async function uploadFile(
  file: File,
  options?: {
    filename?: string;
    onProgress?: (percent: number) => void;
  }
): Promise<QiniuUploadResponse> {
  // 获取上传凭证
  const tokenData = await getUploadToken(
    options?.filename || generateUniqueFilename(file.name)
  );

  // 创建FormData
  const formData = new FormData();
  formData.append('key', tokenData.key);
  formData.append('token', tokenData.token);
  formData.append('file', file);

  // 上传文件
  return new Promise<QiniuUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 监听上传进度
    if (options?.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          options.onProgress!(percent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          ...response,
          url: buildFileUrl(response.key, tokenData.domain),
        });
      } else {
        reject(new Error(`上传失败: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('上传失败'));
    });

    xhr.open('POST', tokenData.uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Base64转File
 */
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * File转Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

