'use client';

import React, { useState, useRef } from 'react';

interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  ctx?: string;
  retryCount: number;
}

interface UploadResponse {
  key: string;
  hash: string;
  fsize: number;
  bucket: string;
  url: string;
}

interface QiniuChunkUploaderProps {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (percent: number, uploadedBytes: number, totalBytes: number) => void;
  onChunkProgress?: (chunkIndex: number, percent: number) => void;
  accept?: string;
  maxSize?: number; // 单位：MB
  chunkSize?: number; // 分片大小，单位：MB，默认4MB
  maxRetries?: number; // 每个分片的最大重试次数
  concurrency?: number; // 并发上传的分片数
  className?: string;
  showChunkDetails?: boolean; // 是否显示分片详情
}

/**
 * 七牛云大文件分片上传组件
 * 支持断点续传、并发上传、自动重试
 */
export default function QiniuChunkUploader({
  onSuccess,
  onError,
  onProgress,
  onChunkProgress,
  accept,
  maxSize = 1024, // 默认最大1GB
  chunkSize = 4, // 默认4MB分片
  maxRetries = 3, // 默认每个分片最多重试3次
  concurrency = 3, // 默认并发3个分片
  className = '',
  showChunkDetails = false,
}: QiniuChunkUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadInfoRef = useRef<{
    token: string;
    key: string;
    domain: string;
    uploadUrl: string;
  } | null>(null);

  // 点击上传按钮
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // 文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      const error = new Error(`文件大小不能超过 ${maxSize}MB`);
      onError?.(error);
      return;
    }

    setCurrentFile(file);
    await startUpload(file);

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 初始化分片信息
   */
  const initializeChunks = (file: File): ChunkInfo[] => {
    const chunkSizeBytes = chunkSize * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSizeBytes);
    const chunkList: ChunkInfo[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSizeBytes;
      const end = Math.min(start + chunkSizeBytes, file.size);
      chunkList.push({
        index: i,
        start,
        end,
        size: end - start,
        status: 'pending',
        progress: 0,
        retryCount: 0,
      });
    }

    return chunkList;
  };

  /**
   * 开始上传
   */
  const startUpload = async (file: File) => {
    try {
      setUploading(true);
      setTotalProgress(0);

      // 初始化分片
      const chunkList = initializeChunks(file);
      setChunks(chunkList);

      // 获取上传凭证
      const tokenRes = await fetch('/api/upload/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `${Date.now()}-${file.name}`,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error('获取上传凭证失败');
      }

      const uploadInfo = await tokenRes.json();
      uploadInfoRef.current = uploadInfo;

      // 创建AbortController
      abortControllerRef.current = new AbortController();

      // 并发上传分片
      await uploadChunksConcurrently(file, chunkList);

      // 合并分片
      await mergeChunks(file, chunkList);
    } catch (error) {
      console.error('上传失败:', error);
      onError?.(error as Error);
      setUploading(false);
    }
  };

  /**
   * 并发上传分片
   */
  const uploadChunksConcurrently = async (file: File, chunkList: ChunkInfo[]) => {
    const uploadQueue = [...chunkList];
    const activeUploads: Promise<void>[] = [];

    while (uploadQueue.length > 0 || activeUploads.length > 0) {
      // 检查是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('上传已取消');
      }

      // 填充并发队列
      while (activeUploads.length < concurrency && uploadQueue.length > 0) {
        const chunk = uploadQueue.shift()!;
        const uploadPromise = uploadChunk(file, chunk)
          .then(() => {
            // 移除完成的上传
            const index = activeUploads.indexOf(uploadPromise);
            if (index > -1) {
              activeUploads.splice(index, 1);
            }
          })
          .catch((error) => {
            // 移除失败的上传
            const index = activeUploads.indexOf(uploadPromise);
            if (index > -1) {
              activeUploads.splice(index, 1);
            }
            
            // 如果还有重试次数，重新加入队列
            if (chunk.retryCount < maxRetries) {
              chunk.retryCount++;
              chunk.status = 'pending';
              uploadQueue.push(chunk);
            } else {
              throw error;
            }
          });

        activeUploads.push(uploadPromise);
      }

      // 等待至少一个上传完成
      if (activeUploads.length > 0) {
        await Promise.race(activeUploads);
      }
    }
  };

  /**
   * 上传单个分片
   */
  const uploadChunk = async (file: File, chunk: ChunkInfo) => {
    if (!uploadInfoRef.current) {
      throw new Error('上传信息未初始化');
    }

    const { token, key, uploadUrl } = uploadInfoRef.current;

    // 更新状态
    setChunks((prev) =>
      prev.map((c) => (c.index === chunk.index ? { ...c, status: 'uploading' } : c))
    );

    // 提取分片数据
    const chunkData = file.slice(chunk.start, chunk.end);

    // 使用七牛云分片上传接口
    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', chunkData);

    // 创建XMLHttpRequest以支持进度监听
    const xhr = new XMLHttpRequest();

    const uploadPromise = new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          
          // 更新分片进度
          setChunks((prev) =>
            prev.map((c) =>
              c.index === chunk.index ? { ...c, progress: percent } : c
            )
          );

          onChunkProgress?.(chunk.index, percent);

          // 更新总进度
          updateTotalProgress();
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.ctx);
        } else {
          reject(new Error(`分片 ${chunk.index + 1} 上传失败`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`分片 ${chunk.index + 1} 上传失败`));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });

      // 使用七牛云的mkblk接口
      xhr.open('POST', `${uploadUrl}/mkblk/${chunk.size}`);
      xhr.setRequestHeader('Authorization', `UpToken ${token}`);
      xhr.send(chunkData);
    });

    // 支持取消
    abortControllerRef.current?.signal.addEventListener('abort', () => {
      xhr.abort();
    });

    try {
      const ctx = await uploadPromise;
      
      // 更新状态
      setChunks((prev) =>
        prev.map((c) =>
          c.index === chunk.index
            ? { ...c, status: 'success', progress: 100, ctx }
            : c
        )
      );
    } catch (error) {
      // 更新状态
      setChunks((prev) =>
        prev.map((c) =>
          c.index === chunk.index ? { ...c, status: 'error' } : c
        )
      );
      throw error;
    }
  };

  /**
   * 更新总进度
   */
  const updateTotalProgress = () => {
    setChunks((prev) => {
      const totalSize = prev.reduce((sum, c) => sum + c.size, 0);
      const uploadedSize = prev.reduce(
        (sum, c) => sum + (c.size * c.progress) / 100,
        0
      );
      const percent = Math.round((uploadedSize / totalSize) * 100);
      
      setTotalProgress(percent);
      onProgress?.(percent, uploadedSize, totalSize);
      
      return prev;
    });
  };

  /**
   * 合并分片
   */
  const mergeChunks = async (file: File, chunkList: ChunkInfo[]) => {
    if (!uploadInfoRef.current) {
      throw new Error('上传信息未初始化');
    }

    const { token, key, domain, uploadUrl } = uploadInfoRef.current;

    // 构造ctx列表
    const ctxList = chunkList.map((c) => c.ctx).join(',');

    // 使用mkfile接口合并
    const mergeUrl = `${uploadUrl}/mkfile/${file.size}/key/${btoa(key)}`;
    
    const response = await fetch(mergeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `UpToken ${token}`,
      },
      body: ctxList,
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      throw new Error('合并分片失败');
    }

    const result = await response.json();
    
    setUploading(false);
    setTotalProgress(100);
    
    onSuccess?.({
      ...result,
      url: `${domain}/${result.key}`,
    });
  };

  /**
   * 取消上传
   */
  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setUploading(false);
    setTotalProgress(0);
    setChunks([]);
    setCurrentFile(null);
  };

  /**
   * 格式化文件大小
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? '上传中...' : '选择大文件'}
      </button>

      {currentFile && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-gray-800">{currentFile.name}</p>
              <p className="text-sm text-gray-500">{formatSize(currentFile.size)}</p>
            </div>
            {uploading && (
              <button
                onClick={cancelUpload}
                className="px-3 py-1 text-sm text-red-500 hover:text-red-700 border border-red-500 rounded hover:bg-red-50 transition-colors"
              >
                取消上传
              </button>
            )}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                总进度: {totalProgress}%
              </span>
              <span className="text-sm text-gray-500">
                {chunks.filter((c) => c.status === 'success').length} / {chunks.length} 分片
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {showChunkDetails && chunks.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">分片详情:</p>
              <div className="space-y-1">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.index}
                    className="flex items-center justify-between text-xs p-2 bg-white rounded"
                  >
                    <span className="text-gray-600">
                      分片 {chunk.index + 1} ({formatSize(chunk.size)})
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded ${
                          chunk.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : chunk.status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : chunk.status === 'uploading'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {chunk.status === 'success'
                          ? '✓'
                          : chunk.status === 'error'
                          ? '✗'
                          : chunk.status === 'uploading'
                          ? `${chunk.progress}%`
                          : '等待'}
                      </span>
                      {chunk.retryCount > 0 && (
                        <span className="text-orange-500">
                          重试 {chunk.retryCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

