// The live preview and the exported document use the same paper styles.
export const resumeCss = `
.cv-surface { container: cv / inline-size; color-scheme: light; }
.cv {
  --ink: #222c37;
  --muted: #586575;
  --accent: #23569c;
  --line: #dbe1e7;
  --tint: #edf3fb;
  --pad: clamp(20px,4.4cqw,35px);
  box-sizing: border-box;
  min-height: 141.4cqw;
  background: #fff;
  color: var(--ink);
  font: 400 clamp(12px,1.72cqw,14px)/1.65 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
  text-align: left;
  overflow-wrap: anywhere;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.cv * { box-sizing: border-box; }
.cv :is(h2,h3,h4,p,ul) { margin: 0; padding: 0; }
.cv .cv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.4em;
  padding: var(--pad);
  border-bottom: 1px solid var(--line);
}
.cv .cv-header h2 {
  font-family: inherit;
  font-size: 2.5em;
  font-weight: 720;
  line-height: 1.12;
  letter-spacing: .04em;
  color: inherit;
}
.cv .cv-role {
  margin-top: .55em;
  font-size: 1.02em;
  font-weight: 500;
}
.cv .cv-contacts {
  display: flex;
  flex-direction: column;
  gap: .15em;
  list-style: none;
  color: var(--muted);
  text-align: right;
  font-size: .9em;
}
.cv .cv-body { padding: var(--pad); }
.cv .cv-section+.cv-section { margin-top: 1.65em; }
.cv .cv-section h3 {
  display: flex;
  align-items: center;
  gap: .55em;
  margin-bottom: .85em;
  font-family: inherit;
  font-size: 1.16em;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
  break-after: avoid;
}
.cv .cv-summary-text { white-space: pre-line; }
.cv .cv-entry+.cv-entry { margin-top: 1em; }
.cv .cv-entry-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  column-gap: .6em;
  break-after: avoid;
}
.cv .cv-entry h4 {
  font-size: 1.05em;
  font-weight: 700;
  color: var(--accent);
}
.cv .cv-date {
  color: var(--muted);
  font-size: .85em;
  font-variant-numeric: tabular-nums;
}
.cv .cv-subtitle {
  margin-top: .2em;
  font-size: .93em;
  color: var(--muted);
  break-after: avoid;
}
.cv .cv-points {
  margin-top: .4em;
  padding-inline-start: 1.15em;
  list-style: disc;
}
.cv .cv-points li { padding-inline-start: .12em; margin-top: .18em; }
.cv .cv-points li::marker { color: var(--muted); font-size: .85em; }
.cv .cv-skill-group+.cv-skill-group { margin-top: .75em; }
.cv .cv-skill-group h4 {
  margin-bottom: .28em;
  font-size: .92em;
  font-weight: 650;
}
.cv .cv-tags {
  display: flex;
  flex-wrap: wrap;
  gap: .35em;
  list-style: none;
}
.cv .cv-tags li {
  padding: .06em .52em;
  border-radius: 3px;
  background: var(--tint);
  color: var(--accent);
  font-size: .85em;
}
.cv .cv-entry .cv-tags { margin-top: .65em; }
.cv-classic { --side: 29%; }
.cv-classic:has(.cv-columns) { background: linear-gradient(to right,#f6f8fa calc(var(--side) - 1px),var(--line) var(--side),white var(--side)); }
.cv-classic .cv-header { background: #fff; }
.cv .cv-columns { display: grid; grid-template-columns: minmax(0,var(--side)) minmax(0,1fr); }
.cv-classic .cv-body:has(.cv-columns) { padding: 0; }
.cv-classic .cv-side {
  padding: var(--pad) .95em var(--pad) calc(var(--pad)*.75);
  background: #f6f8fa;
  border-right: 1px solid var(--line);
}
.cv-classic .cv-main { min-width: 0; padding: var(--pad) calc(var(--pad)*.8); }
.cv-classic .cv-section h3::before {
  content: "";
  width: .57em;
  height: .57em;
  flex: none;
  border: 3px solid #354357;
  border-radius: 50%;
}
.cv-classic .cv-projects .cv-entry {
  padding: 1em;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: #fbfcfd;
}
.cv-classic .cv-side .cv-date { display: block; }
.cv-classic .cv-main .cv-date {
  padding: 0 .5em;
  border-radius: 1em;
  background: #f0f2f4;
}
.cv-editorial {
  --ink: #342e2a;
  --muted: #675f56;
  --accent: #473a30;
  --line: #d4cdc2;
  --tint: #f5f1ea;
}
.cv-editorial :is(.cv-header h2, .cv-section h3) { font-family: "Songti SC","Noto Serif CJK SC","STSong",Georgia,serif; }
.cv-editorial .cv-header {
  display: block;
  margin: 0 var(--pad);
  padding: var(--pad) 0 1.4em;
  border-bottom: 2px solid var(--ink);
}
.cv-editorial .cv-contacts {
  flex-direction: row;
  flex-wrap: wrap;
  gap: .25em 1em;
  margin-top: .75em;
  text-align: left;
}
.cv-editorial .cv-section h3::after {
  content: "";
  height: 1px;
  flex: 1;
  background: var(--line);
}
.cv-editorial .cv-tags li {
  padding: 0;
  background: none;
  color: var(--muted);
}
.cv-editorial .cv-tags li+li::before { content: "·"; margin-right: .35em; }
.cv:is(.cv-editorial, .cv-portfolio) .cv-skill-group {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: .1em .9em;
}
.cv:is(.cv-editorial, .cv-portfolio) .cv-skill-group+.cv-skill-group { margin-top: .3em; }
.cv-portfolio {
  --ink: #183f39;
  --accent: #285e52;
  --muted: #4d655e;
  --line: #c9dcd4;
  --tint: #eaf3ef;
}
.cv-portfolio .cv-header {
  align-items: center;
  background: #244f46;
  color: #fff;
  border: 0;
}
.cv-portfolio .cv-contacts { color: #deeee6; }
.cv-portfolio .cv-role { color: #e5f0e9; }
.cv-portfolio .cv-section h3 { color: var(--accent); letter-spacing: .05em; }
.cv-portfolio .cv-projects .cv-entry {
  padding: .9em 1.1em;
  border-left: 3px solid #548876;
  background: #f1f6f3;
}
.cv-portfolio .cv-projects .cv-entry h4 { font-size: 1.14em; }
.cv-portfolio .cv-section+.cv-section { border-top: 1px solid var(--line); padding-top: 1em; }
@media screen {
  @container cv (max-width:430px) {
    .cv { --pad: 16px; font-size: 12px; }
    .cv .cv-header { flex-wrap: wrap; gap: .65em; }
    .cv .cv-contacts {
      flex-direction: row;
      flex-wrap: wrap;
      text-align: left;
      gap: .18em .8em;
    }
    .cv-classic { --side: 33%; }
    .cv-classic .cv-side, .cv-classic .cv-main { padding: 16px 9px; }
    .cv-classic .cv-projects .cv-entry { padding: .65em; }
  }
}
@media print {
  .cv {
    --pad: 6mm;
    min-height: 275mm;
    font-size: 9.5pt;
    line-height: 1.5;
  }
  .cv .cv-section+.cv-section { margin-top: 1.25em; }
  .cv .cv-section h3 { margin-bottom: .6em; }
  .cv .cv-body, .cv .cv-header { overflow: visible; }
  .cv :is(p,li) { orphans: 2; widows: 2; }
  .cv .cv-entry-line, .cv .cv-skill-group h4 { break-after: avoid; }
  .cv .cv-projects .cv-entry { box-decoration-break: clone; -webkit-box-decoration-break: clone; }
}
`
