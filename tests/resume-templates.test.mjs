import assert from 'node:assert/strict'
import test from 'node:test'
import { draftResume } from '../lib/resume/draft.ts'
import { readResumeReport, resumeDocumentSchema } from '../lib/resume/schema.ts'
import { renderResumeBody, resumeHtml, resumeStyles } from '../lib/resume/templates.ts'

test('an original can be previewed without a model, including unclassified prose', () => {
  const raw = '姓名：方澄\n求职意向：产品运营\nfang@example.com\n这段未标注的自述应该保留。\n工作经历：内容运营组｜产品运营｜2024 至今\n- 维护资料库。\n项目经历\n课程检索\n- 核对条目。'
  const doc = draftResume(raw, '运营')
  assert.equal(doc.name, '方澄')
  assert.equal(doc.role, '产品运营')
  assert.deepEqual(doc.contacts, ['fang@example.com'])
  assert.match(doc.summary, /未标注的自述/)
  assert.deepEqual(doc.work[0], { title: '内容运营组', subtitle: '产品运营', dates: '2024 至今', points: ['维护资料库。'], tags: [] })
  assert.deepEqual(doc.projects[0].points, ['核对条目。'])
  assert.equal(doc.education.length, 0)
  assert.equal(draftResume('负责梳理产品目录和交付记录。', '').name, '')
  const inline = draftResume('方澄｜fang@example.com｜苏州\n项目经历\n课程检索', '运营')
  assert.equal(inline.name, '方澄')
  assert.deepEqual(inline.contacts, ['fang@example.com', '苏州'])
})

test('all templates use the same content, omit empty sections, and escape literal text in exports', () => {
  const doc = resumeDocumentSchema.parse({
    name: 'A & B', summary: '文档 <草稿>',
    work: [{ title: '工作一', points: ['交付一'] }], projects: [{ title: '项目二', points: ['交付二'] }],
  })
  for (const style of resumeStyles) {
    const body = renderResumeBody(doc, style)
    assert.match(body, /A &amp; B/)
    assert.match(body, /文档 &lt;草稿&gt;/)
    assert.ok(!body.includes('教育背景'))
    for (const text of ['工作一', '项目二', '交付一', '交付二']) assert.ok(body.includes(text))
    assert.equal(body.indexOf('项目二') < body.indexOf('工作一'), style === 'portfolio')
    assert.ok(resumeHtml(body).includes(body))
  }
  assert.equal(resumeDocumentSchema.safeParse({ name: '空白正文' }).success, false)
})

test('existing API feedback can be restyled without assigning its unlabelled points to a company', () => {
  const original = draftResume('姓名：方澄\n个人简介\n原简介\n工作经历\n海帆｜运营｜2024 至今\n- 已有工作要点', '运营')
  const response = { score: 80, rewrittenSummary: '新简介', optimizedBullets: ['已有工作要点', '优化后的要点'] }
  const { document } = readResumeReport(response, original, '内容运营')
  assert.equal(document.name, '方澄')
  assert.equal(document.summary, '新简介')
  assert.deepEqual(document.work, original.work)
  assert.deepEqual(document.highlights, ['优化后的要点'])
  for (const style of resumeStyles) assert.match(renderResumeBody(document, style), /优化后的要点/)
  assert.deepEqual(readResumeReport({ ...response, document: original }, original, '内容运营').document, original)
  assert.throws(() => readResumeReport(null, original, '内容运营'))
  assert.throws(() => readResumeReport({ score: 80 }, original, '内容运营'))
})
