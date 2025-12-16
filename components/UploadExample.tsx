'use client';

import React, { useState } from 'react';
import QiniuUploader from './QiniuUploader';
import QiniuChunkUploader from './QiniuChunkUploader';

/**
 * 七牛云上传组件使用示例
 */
export default function UploadExample() {
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">七牛云上传示例</h1>

      {/* 基础上传组件 */}
      <section className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">基础文件上传</h2>
        <p className="text-gray-600 mb-4">
          支持小文件直传和大文件自动分片上传（超过4MB自动分片）
        </p>
        
        <QiniuUploader
          maxSize={100}
          chunkSize={4}
          accept="image/*,video/*,.pdf,.doc,.docx"
          onSuccess={(response) => {
            console.log('上传成功:', response);
            setUploadedUrl(response.url);
            setError('');
          }}
          onError={(err) => {
            console.error('上传失败:', err);
            setError(err.message);
            setUploadedUrl('');
          }}
          onProgress={(percent) => {
            console.log('上传进度:', percent + '%');
          }}
        />

        {/* 自定义上传按钮 */}
        <div className="mt-4">
          <QiniuUploader
            maxSize={100}
            onSuccess={(response) => {
              setUploadedUrl(response.url);
              setError('');
            }}
            onError={(err) => {
              setError(err.message);
              setUploadedUrl('');
            }}
          >
            <div className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer inline-block">
              📁 自定义上传按钮
            </div>
          </QiniuUploader>
        </div>
      </section>

      {/* 大文件分片上传组件 */}
      <section className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">大文件分片上传</h2>
        <p className="text-gray-600 mb-4">
          支持超大文件上传、断点续传、并发上传、自动重试
        </p>
        
        <QiniuChunkUploader
          maxSize={1024}
          chunkSize={4}
          concurrency={3}
          maxRetries={3}
          showChunkDetails={true}
          accept="video/*,.zip,.rar,.7z"
          onSuccess={(response) => {
            console.log('上传成功:', response);
            setUploadedUrl(response.url);
            setError('');
          }}
          onError={(err) => {
            console.error('上传失败:', err);
            setError(err.message);
            setUploadedUrl('');
          }}
          onProgress={(percent, uploaded, total) => {
            console.log(`上传进度: ${percent}% (${uploaded}/${total} bytes)`);
          }}
          onChunkProgress={(index, percent) => {
            console.log(`分片 ${index + 1} 进度: ${percent}%`);
          }}
        />
      </section>

      {/* 上传结果展示 */}
      {uploadedUrl && (
        <section className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✓ 上传成功</h3>
          <p className="text-sm text-gray-600 mb-2">文件URL:</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 break-all underline"
          >
            {uploadedUrl}
          </a>
          
          {/* 如果是图片，显示预览 */}
          {uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
            <div className="mt-4">
              <img
                src={uploadedUrl}
                alt="上传的图片"
                className="max-w-full h-auto rounded-lg shadow"
              />
            </div>
          )}
        </section>
      )}

      {/* 错误提示 */}
      {error && (
        <section className="p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">✗ 上传失败</h3>
          <p className="text-red-600">{error}</p>
        </section>
      )}

      {/* 使用说明 */}
      <section className="p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold mb-1">QiniuUploader (基础上传)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>适合小于100MB的文件</li>
              <li>自动根据文件大小选择直传或分片上传</li>
              <li>支持自定义UI</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">QiniuChunkUploader (大文件上传)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>适合大于100MB的大文件</li>
              <li>支持并发上传多个分片</li>
              <li>自动重试失败的分片</li>
              <li>显示详细的分片上传进度</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

