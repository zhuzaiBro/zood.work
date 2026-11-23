const platforms = {
  alibaba: { name: '阿里巴巴国际站', icon: '/brand/commerce/alibaba-com.jpg' },
  aliexpress: { name: '速卖通', icon: '/brand/commerce/aliexpress.jpg' },
  cainiao: { name: '菜鸟', icon: '/brand/commerce/cainiao.png' },
  temu: { name: 'Temu', icon: '/brand/commerce/temu.jpg' },
  tiktok: { name: 'TikTok Shop', icon: '/brand/commerce/tiktok-shop.png' },
};

export type CommercePlatform = (typeof platforms)[keyof typeof platforms];

// Editorial examples for the workflow in each original practice collection.
const collectionPlatforms: Record<string, keyof typeof platforms | undefined> = {
  'b007572e-e421-47f7-a62d-f3c3c3cfd42f': 'temu',       // 利润与库存
  'b5d97e5f-731d-5d13-941e-1fbe91eb5439': 'aliexpress', // 商品页与退货
  '4a6a1c4f-b22b-55e3-a88e-b1aef22ae3b1': 'cainiao',    // 跨境履约
  'f9c0bf20-820a-5e72-9442-e288ea0568f3': 'aliexpress', // 店铺上架
  '944f2014-81f0-523c-a260-22613c79806f': 'temu',       // 活动与结算
  'c9624df1-0402-4bac-b644-27ea5efc7a2a': 'alibaba',    // 渠道与回款
  '091ba677-fd85-5a59-8b55-a39eaf5b38ce': 'alibaba',    // 经销商试单
  '9d04b118-bc58-55dc-a603-32081db45206': 'tiktok',     // 达人合作
  '64475a4b-17d2-56e2-b14c-0d6a38848ab1': 'alibaba',    // 海外买手采购
  '48e02e96-5d8d-59c9-85d7-1a5ec2eefcb9': 'alibaba',    // 外贸报价
  'd60881e0-752a-56b5-8d3a-425c56e5b18a': 'aliexpress', // 商家运营初面
  '0b83a2d4-d17e-5226-a0b7-82ffc1608958': 'tiktok',     // 内容电商试卖
  '274bb6b5-c198-5126-9555-1679d873a3bb': 'alibaba',    // 企业采购与销售复盘
};

export function commercePlatformFor(collectionId: string | null) {
  const key = collectionId && collectionPlatforms[collectionId];
  return key ? platforms[key] : undefined;
}
