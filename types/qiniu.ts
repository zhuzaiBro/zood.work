/**
 * 七牛云上传相关类型定义
 */

/**
 * 上传凭证响应
 */
export interface QiniuTokenResponse {
  token: string;
  key: string;
  domain: string;
  uploadUrl: string;
}

/**
 * 上传成功响应
 */
export interface QiniuUploadResponse {
  key: string;
  hash: string;
  fsize: number;
  bucket: string;
  name?: string;
  url: string;
}

/**
 * 分片信息
 */
export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  ctx?: string;
  retryCount: number;
}

/**
 * 上传配置
 */
export interface QiniuUploadConfig {
  /** 最大文件大小（MB） */
  maxSize?: number;
  /** 分片大小（MB） */
  chunkSize?: number;
  /** 接受的文件类型 */
  accept?: string;
  /** 并发上传数 */
  concurrency?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 上传回调函数
 */
export interface QiniuUploadCallbacks {
  /** 上传成功回调 */
  onSuccess?: (response: QiniuUploadResponse) => void;
  /** 上传失败回调 */
  onError?: (error: Error) => void;
  /** 上传进度回调 */
  onProgress?: (percent: number) => void;
  /** 分片进度回调 */
  onChunkProgress?: (chunkIndex: number, percent: number) => void;
}

/**
 * 七牛云区域配置
 */
export enum QiniuRegion {
  /** 华东 */
  HUADONG = 'https://upload.qiniup.com',
  /** 华北 */
  HUABEI = 'https://upload-z1.qiniup.com',
  /** 华南 */
  HUANAN = 'https://upload-z2.qiniup.com',
  /** 北美 */
  BEIMEI = 'https://upload-na0.qiniup.com',
  /** 东南亚 */
  DONGNAN_YA = 'https://upload-as0.qiniup.com',
}

/**
 * 上传策略
 */
export interface QiniuUploadPolicy {
  /** 存储空间名称 */
  scope: string;
  /** 凭证有效期（秒） */
  expires?: number;
  /** 文件大小限制（字节） */
  fsizeLimit?: number;
  /** 文件存储类型 (0: 标准存储, 1: 低频存储, 2: 归档存储) */
  fileType?: 0 | 1 | 2;
  /** 自定义返回内容 */
  returnBody?: string;
}

