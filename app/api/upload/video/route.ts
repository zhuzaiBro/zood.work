import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cloudflare Stream API 配置
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_STREAM_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

// 配置 body 解析（Next.js App Router 默认支持 FormData，但可以添加配置）
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 分钟超时

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

    // 3. 获取表单数据
    const contentType = request.headers.get('content-type') || '';
    console.log('请求 Content-Type:', contentType);
    
    // 检查是否是 FormData 请求
    if (!contentType.includes('multipart/form-data')) {
      console.warn('Content-Type 不是 multipart/form-data，尝试解析...');
    }
    
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      console.error('解析 FormData 失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        contentType,
      });
      return NextResponse.json(
        { 
          error: '无法解析上传文件',
          details: error.message || '请确保使用 FormData 格式发送请求'
        },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const meta = formData.get('meta') as string | null;

    if (!file) {
      return NextResponse.json({ error: '请选择视频文件' }, { status: 400 });
    }

    // 4. 验证文件类型
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: '文件必须是视频格式' }, { status: 400 });
    }

    // 5. 上传到 Cloudflare Stream
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    if (title) {
      uploadFormData.append('meta', JSON.stringify({ name: title }));
    }
    if (meta) {
      uploadFormData.append('meta', meta);
    }

    const uploadResponse = await fetch(CLOUDFLARE_STREAM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('Cloudflare Stream 上传失败:', errorData);
      return NextResponse.json(
        { error: `上传失败: ${errorData.errors?.[0]?.message || '未知错误'}` },
        { status: uploadResponse.status }
      );
    }

    const streamData = await uploadResponse.json();
    const videoId = streamData.result?.uid;
    const videoUrl = streamData.result?.playback?.hls || `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

    // 6. 返回视频信息
    return NextResponse.json({
      success: true,
      video: {
        id: videoId,
        url: videoUrl,
        thumbnail: streamData.result?.thumbnail || null,
        duration: streamData.result?.duration || null,
        status: streamData.result?.status || 'pending',
        meta: streamData.result?.meta || {},
      },
    });
  } catch (error: any) {
    console.error('视频上传错误:', error);
    return NextResponse.json(
      { error: error.message || '上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取视频信息
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: '缺少 videoId 参数' }, { status: 400 });
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Cloudflare 配置缺失' },
        { status: 500 }
      );
    }

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
    return NextResponse.json({
      success: true,
      video: data.result,
    });
  } catch (error: any) {
    console.error('获取视频信息错误:', error);
    return NextResponse.json(
      { error: error.message || '获取视频信息失败' },
      { status: 500 }
    );
  }
}
