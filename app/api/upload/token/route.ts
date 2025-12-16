import { NextRequest, NextResponse } from 'next/server';
import * as qiniu from 'qiniu';

/**
 * 生成七牛云上传凭证
 * POST /api/upload/token
 * Body: { filename?: string, expireSeconds?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, expireSeconds = 3600 } = body;

    // 从环境变量读取七牛云配置
    const accessKey = process.env.QINIU_ACCESS_KEY;
    const secretKey = process.env.QINIU_SECRET_KEY;
    const bucket = process.env.QINIU_BUCKET;
    const domain = process.env.QINIU_DOMAIN;

    if (!accessKey || !secretKey || !bucket || !domain) {
      return NextResponse.json(
        { error: '七牛云配置不完整' },
        { status: 500 }
      );
    }

    // 创建鉴权对象
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

    // 配置上传策略
    const options = {
      scope: filename ? `${bucket}:${filename}` : bucket,
      expires: expireSeconds, // 凭证有效期，单位秒
      returnBody: JSON.stringify({
        key: '$(key)',
        hash: '$(etag)',
        fsize: '$(fsize)',
        bucket: '$(bucket)',
        name: '$(x:name)',
      }),
    };

    // 生成上传策略
    const putPolicy = new qiniu.rs.PutPolicy(options);
    
    // 生成上传凭证
    const uploadToken = putPolicy.uploadToken(mac);

    // 生成唯一文件名（如果没有提供）
    const key = filename || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return NextResponse.json({
      token: uploadToken,
      key,
      domain,
      uploadUrl: 'https://up-z0.qiniup.com', // 华东-浙江区域
    });
  } catch (error) {
    console.error('生成上传凭证失败:', error);
    return NextResponse.json(
      { error: '生成上传凭证失败' },
      { status: 500 }
    );
  }
}

