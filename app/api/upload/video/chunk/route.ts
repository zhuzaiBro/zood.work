import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cloudflare Stream API 配置
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_STREAM_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

// 初始化 Direct Creator Upload
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份和权限
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查管理员权限
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !(profile as any).is_admin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 2. 验证环境变量
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Cloudflare 配置缺失，请检查环境变量' },
        { status: 500 }
      );
    }

    // 3. 获取请求参数
    const body = await request.json();
    const { fileName, fileSize, title } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: '缺少文件名或文件大小' },
        { status: 400 }
      );
    }

    // 4. 创建 Direct Creator Upload（用于大文件直接上传）
    const createUploadResponse = await fetch(`${CLOUDFLARE_STREAM_API_URL}/direct_upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600, // 最大时长 1 小时
        meta: title ? { name: title } : {},
        requireSignedURLs: false,
        allowedOrigins: [],
      }),
    });

    console.log('createUploadResponse', createUploadResponse);

    if (!createUploadResponse.ok) {
      const errorData = await createUploadResponse.json();
      console.error('创建上传会话失败:', errorData);
      return NextResponse.json(
        { error: `创建上传会话失败: ${errorData.errors?.[0]?.message || '未知错误'}` },
        { status: createUploadResponse.status }
      );
    }

    const uploadData = await createUploadResponse.json();
    const uploadId = uploadData.result?.uid;
    const uploadURL = uploadData.result?.uploadURL;

    if (!uploadId || !uploadURL) {
      return NextResponse.json(
        { error: '获取上传 URL 失败' },
        { status: 500 }
      );
    }

    // 5. 返回上传信息
    return NextResponse.json({
      success: true,
      uploadId,
      uploadURL,
      videoId: uploadId, // Cloudflare Stream 的 uploadId 就是 videoId
    });
  } catch (error: any) {
    console.error('创建上传会话错误:', error);
    return NextResponse.json(
      { error: error.message || '创建上传会话失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 完成上传并获取视频信息
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: '缺少 videoId' }, { status: 400 });
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Cloudflare 配置缺失' },
        { status: 500 }
      );
    }

    // 获取视频信息
    const response = await fetch(
      `${CLOUDFLARE_STREAM_API_URL}/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '获取视频信息失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const video = data.result;
    const videoUrl = video.playback?.hls || `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

    return NextResponse.json({
      success: true,
      video: {
        id: videoId,
        url: videoUrl,
        thumbnail: video.thumbnail || null,
        duration: video.duration || null,
        status: video.status || 'pending',
        meta: video.meta || {},
      },
    });
  } catch (error: any) {
    console.error('获取视频信息错误:', error);
    return NextResponse.json(
      { error: error.message || '获取视频信息失败' },
      { status: 500 }
    );
  }
}
