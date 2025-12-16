'use client'

import Script from 'next/script'

export default function CozeChat() {
  return (
    <>
      <Script 
        src="https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js"
        strategy="lazyOnload"
        onLoad={() => {
          // @ts-ignore
          if (window.CozeWebSDK) {
            // @ts-ignore
            new window.CozeWebSDK.WebChatClient({
              config: {
                bot_id: '7579191514644611107',
              },
              componentProps: {
                title: 'Coze',
              },
              auth: {
                type: 'token',
                // 请在此处替换为您真实的 Personal Access Token (PAT)
                token: 'pat_ysfaU7csTXKvFhlSgtkRUzC2RKX2Tz8PGFU34X9T9vX5mFpvmQE75HhliZDPQonh',
                onRefreshToken: function () {
                  // 请在此处替换为您真实的 Personal Access Token (PAT)
                  return 'pat_ysfaU7csTXKvFhlSgtkRUzC2RKX2Tz8PGFU34X9T9vX5mFpvmQE75HhliZDPQonh'
                }
              }
            });
          }
        }}
      />
    </>
  )
}

