/**
 * Cloudflare Stream 配置测试脚本
 * 用于验证 Account ID 和 API Token 是否正确
 * 
 * 使用方法：
 * 1. 在 .env.local 中配置 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN
 * 2. 运行: node scripts/test-cloudflare-config.js
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function testCloudflareConfig() {
  console.log('🔍 开始测试 Cloudflare Stream 配置...\n');

  // 1. 检查环境变量
  console.log('1️⃣ 检查环境变量:');
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('❌ CLOUDFLARE_ACCOUNT_ID 未设置');
    return;
  }
  console.log('✅ CLOUDFLARE_ACCOUNT_ID:', CLOUDFLARE_ACCOUNT_ID);

  if (!CLOUDFLARE_API_TOKEN) {
    console.error('❌ CLOUDFLARE_API_TOKEN 未设置');
    return;
  }
  console.log('✅ CLOUDFLARE_API_TOKEN:', CLOUDFLARE_API_TOKEN.substring(0, 20) + '...\n');

  // 2. 验证 Token
  console.log('2️⃣ 验证 API Token:');
  try {
    const verifyResponse = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      console.error('❌ Token 验证失败:', error);
      return;
    }

    const verifyData = await verifyResponse.json();
    console.log('✅ Token 验证成功');
    console.log('   状态:', verifyData.result?.status);
    console.log('   Token ID:', verifyData.result?.id);
    console.log('   权限:', verifyData.result?.policies?.map(p => p.permission_groups?.map(g => g.name).join(', ')).join('; ') || 'N/A');
    console.log('');

    // 从验证响应中获取 Account ID（如果可用）
    if (verifyData.result?.account_id) {
      console.log('📌 从 Token 验证响应中获取到的 Account ID:', verifyData.result.account_id);
      if (verifyData.result.account_id !== CLOUDFLARE_ACCOUNT_ID) {
        console.warn('⚠️  警告: 环境变量中的 Account ID 与 Token 关联的 Account ID 不一致！');
        console.warn('   环境变量中的 Account ID:', CLOUDFLARE_ACCOUNT_ID);
        console.warn('   Token 关联的 Account ID:', verifyData.result.account_id);
        console.warn('   建议使用 Token 关联的 Account ID\n');
      }
    }
  } catch (error) {
    console.error('❌ Token 验证失败:', error.message);
    return;
  }

  // 3. 获取账户信息
  console.log('3️⃣ 获取账户信息:');
  try {
    const accountResponse = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!accountResponse.ok) {
      const error = await accountResponse.json();
      console.error('❌ 获取账户信息失败:', error);
      return;
    }

    const accountData = await accountResponse.json();
    if (accountData.result && accountData.result.length > 0) {
      console.log('✅ 找到', accountData.result.length, '个账户:');
      accountData.result.forEach((account, index) => {
        console.log(`   ${index + 1}. 账户名称: ${account.name}`);
        console.log(`      Account ID: ${account.id}`);
        if (account.id === CLOUDFLARE_ACCOUNT_ID) {
          console.log('      ✅ 与配置的 Account ID 匹配');
        } else {
          console.log('      ⚠️  与配置的 Account ID 不匹配');
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ 获取账户信息失败:', error.message);
  }

  // 4. 测试 Stream API
  console.log('4️⃣ 测试 Stream API:');
  try {
    const streamResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    if (!streamResponse.ok) {
      const error = await streamResponse.json();
      console.error('❌ Stream API 测试失败:');
      console.error('   状态码:', streamResponse.status);
      console.error('   错误信息:', JSON.stringify(error, null, 2));
      
      if (error.errors && error.errors.length > 0) {
        error.errors.forEach(err => {
          if (err.code === 1003) {
            console.error('\n💡 提示: Account ID 可能不正确，请检查:');
            console.error('   1. 登录 Cloudflare Dashboard');
            console.error('   2. 选择任意域名');
            console.error('   3. 在右侧栏找到 Account ID');
            console.error('   4. 或者运行上面的账户列表查看所有 Account ID');
          }
        });
      }
      return;
    }

    const streamData = await streamResponse.json();
    console.log('✅ Stream API 测试成功');
    console.log('   视频总数:', streamData.result_info?.total_count || 0);
    console.log('   当前页:', streamData.result_info?.page || 1);
    console.log('');

    // 5. 测试创建 Direct Creator Upload
    console.log('5️⃣ 测试创建 Direct Creator Upload:');
    try {
      const uploadResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxDurationSeconds: 3600,
            requireSignedURLs: false,
          }),
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('❌ 创建上传会话失败:');
        console.error('   状态码:', uploadResponse.status);
        console.error('   错误信息:', JSON.stringify(error, null, 2));
        return;
      }

      const uploadData = await uploadResponse.json();
      console.log('✅ 创建上传会话成功');
      console.log('   Upload ID:', uploadData.result?.uid);
      console.log('   Upload URL:', uploadData.result?.uploadURL?.substring(0, 50) + '...');
      console.log('');
    } catch (error) {
      console.error('❌ 创建上传会话失败:', error.message);
    }

  } catch (error) {
    console.error('❌ Stream API 测试失败:', error.message);
  }

  console.log('✨ 测试完成！');
}

// 运行测试
testCloudflareConfig().catch(console.error);
