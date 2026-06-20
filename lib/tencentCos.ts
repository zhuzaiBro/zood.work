import COS from 'cos-nodejs-sdk-v5';

type CosUploadResult = {
  key: string;
  url: string | null;
  bucket: string;
  region: string;
};

function getCosConfig() {
  const secretId = process.env.TENCENT_COS_SECRET_ID;
  const secretKey = process.env.TENCENT_COS_SECRET_KEY;
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION || 'ap-shanghai';
  const domain = process.env.TENCENT_COS_DOMAIN;

  if (!secretId || !secretKey || !bucket) {
    throw new Error(
      '缺少腾讯云 COS 配置，请设置 TENCENT_COS_SECRET_ID、TENCENT_COS_SECRET_KEY、TENCENT_COS_BUCKET',
    );
  }

  return {
    secretId,
    secretKey,
    bucket,
    region,
    domain,
  };
}

export function getSafeFileExt(fileName: string, fallback = 'bin') {
  const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext || fallback;
}

export async function uploadBufferToCos(options: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<CosUploadResult> {
  const config = getCosConfig();
  const cos = new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  });

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType || 'application/octet-stream',
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      },
    );
  });

  return {
    key: options.key,
    bucket: config.bucket,
    region: config.region,
    url: config.domain ? `${config.domain.replace(/\/$/, '')}/${options.key}` : null,
  };
}
