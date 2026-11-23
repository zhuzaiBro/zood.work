import Link from 'next/link';

const directions = [
  {
    interest: '喜欢逛店、研究买家为什么下单', role: '跨境电商运营',
    task: '挑一件你用过的商品，找三条海外买家评论。让 AI 把评价按主题整理，再对照原文挑出一个最值得改的卖点。',
    work: '一张中英双语商品页，附上你改标题和卖点的理由。',
    href: '/interview?role=cross-border-ops', link: '练一道运营实战题',
  },
  {
    interest: '擅长沟通，喜欢把人和机会连起来', role: '海外商务拓展',
    task: '选一个想出海的品牌，找三家可能合作的海外店铺。核对它们实际卖什么，再用 AI 起草一封只写给其中一家的合作邮件。',
    work: '一页潜在合作方名单，加一封能说明双方收益的英文邮件。',
    href: '/interview?role=cross-border-bd', link: '练一道合作洽谈题',
  },
  {
    interest: '喜欢折腾工具，愿意试一点代码', role: 'AI 应用开发',
    task: '收集一个产品的五个英文常见问题和官方答案，用 AI 做一个双语问答小样。再问一个资料里没有的问题，检查它会怎样回答。',
    work: '一段两分钟演示，展示一次正确回答和一次你修过的错误。',
    href: '/learn?courseId=2afaa677-1f07-4d36-9b25-129a5fd346f1', link: '进入 AI 应用开发基础课',
  },
];

export default function CareerDirections() {
  return (
    <section id="career-directions" aria-labelledby="directions-title" className="scroll-mt-[var(--site-header-height)] border-b border-slate-200 bg-[#f5f8fc] text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <h2 id="directions-title" className="text-2xl font-bold text-slate-950 sm:text-3xl">哪件事，你愿意先试半小时？</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {directions.map(item => <article key={item.role} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">{item.interest}</p>
            <h3 className="mt-1.5 text-xl font-bold">{item.role}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">{item.task}</p>
            <p className="mb-4 mt-3 border-l-2 border-sky-300 pl-3 text-sm leading-6 text-slate-700"><strong className="text-slate-900">可以放进作品集的成果</strong><br />{item.work}</p>
            <Link href={item.href} className="mt-auto w-fit rounded py-1 text-sm font-semibold text-blue-700 hover:underline">{item.link} →</Link>
          </article>)}
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-700">做完后，找两份相关招聘要求，用自己的作品回答「我做过什么」。如果过程让你愿意再试一次，就把这件作品补完整。如果提不起兴趣，换一条路线也算有收获。</p>
      </div>
    </section>
  );
}
