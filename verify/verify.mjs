#!/usr/bin/env node
/**
 * 면허로드 데이터 검증 스크립트
 *
 * PDF 원본에서 독립적으로 추출한 answer-key.csv 를 기준(ground truth)으로
 * src/data/bank.json 과 public/q/ 이미지 카드가 정확한지 검사한다.
 *
 * 사용법:  node verify/verify.mjs
 * (프로젝트 루트에서 실행)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const KEY = path.join(ROOT, 'verify/answer-key.csv');
const BANK = path.join(ROOT, 'src/data/bank.json');
const CARDS = path.join(ROOT, 'public/q');

const fail = [];
const warn = [];
const ok = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { fail.push(m); console.log(`  ❌ ${m}`); };
const wrn = (m) => { warn.push(m); console.log(`  ⚠️  ${m}`); };

// ── 파일 존재 확인 ──
for (const p of [KEY, BANK]) {
  if (!fs.existsSync(p)) { console.error(`파일 없음: ${p}`); process.exit(1); }
}

// ── 정답표(ground truth) 로드 ──
const key = new Map();
fs.readFileSync(KEY, 'utf-8').trim().split('\n').slice(1).forEach((line) => {
  const m = line.match(/^(\d+),"([\d|]*)",(text|img),(\d+)$/);
  if (!m) return;
  key.set(Number(m[1]), {
    a: m[2] ? m[2].split('|').map(Number) : [],
    t: m[3],
    nc: Number(m[4]),
  });
});

// ── 앱 데이터 로드 ──
const bank = JSON.parse(fs.readFileSync(BANK, 'utf-8'));
const byNum = new Map(bank.map((q) => [q.i, q]));

console.log('\n═══ 1. 문항 수 및 번호 ═══');
key.size === 1000 ? ok(`정답표 1000문항`) : bad(`정답표가 ${key.size}문항 (1000이어야 함)`);
bank.length === 1000 ? ok(`bank.json 1000문항`) : bad(`bank.json이 ${bank.length}문항 (1000이어야 함)`);

const missing = [...key.keys()].filter((n) => !byNum.has(n));
const extra = bank.map((q) => q.i).filter((n) => !key.has(n));
const dup = bank.map((q) => q.i).filter((n, i, arr) => arr.indexOf(n) !== i);
missing.length ? bad(`누락 문항 ${missing.length}개: ${missing.slice(0, 15).join(', ')}`) : ok('누락 문항 없음');
extra.length ? bad(`정답표에 없는 문항 ${extra.length}개: ${extra.slice(0, 15).join(', ')}`) : ok('정체불명 문항 없음');
dup.length ? bad(`중복 문항번호 ${dup.length}개: ${[...new Set(dup)].slice(0, 15).join(', ')}`) : ok('중복 없음');

console.log('\n═══ 2. 정답 일치 (가장 중요) ═══');
const wrongAns = [];
for (const [n, k] of key) {
  const q = byNum.get(n);
  if (!q) continue;
  const a = Array.isArray(q.a) ? [...q.a].sort((x, y) => x - y) : [];
  const g = [...k.a].sort((x, y) => x - y);
  if (a.join(',') !== g.join(',')) wrongAns.push(`#${n} 앱[${q.a}] ≠ 원본[${k.a}]`);
}
wrongAns.length
  ? bad(`정답 불일치 ${wrongAns.length}건:\n     ${wrongAns.slice(0, 20).join('\n     ')}`)
  : ok('1000문항 정답 전부 일치');

console.log('\n═══ 3. 문항 유형 및 보기 개수 ═══');
const wrongType = [];
const wrongChoice = [];
for (const [n, k] of key) {
  const q = byNum.get(n);
  if (!q) continue;
  if (q.t !== k.t) wrongType.push(`#${n} 앱[${q.t}] ≠ 원본[${k.t}]`);
  const nc = q.t === 'text' ? (q.c?.length ?? 0) : (q.nc ?? 4);
  if (nc !== k.nc) wrongChoice.push(`#${n} 보기 ${nc}개 (원본 ${k.nc}개)`);
}
wrongType.length ? bad(`유형 불일치 ${wrongType.length}건: ${wrongType.slice(0, 10).join(' / ')}`) : ok('text/img 유형 전부 일치');
wrongChoice.length ? bad(`보기 개수 불일치 ${wrongChoice.length}건: ${wrongChoice.slice(0, 10).join(' / ')}`) : ok('보기 개수 전부 일치');

console.log('\n═══ 4. 복수정답 문항 ═══');
const multiKey = [...key.values()].filter((k) => k.a.length === 2).length;
const multiApp = bank.filter((q) => q.a?.length === 2).length;
multiKey === multiApp ? ok(`복수정답 ${multiApp}문항 일치`) : bad(`복수정답 앱 ${multiApp} ≠ 원본 ${multiKey}`);

console.log('\n═══ 5. 이미지 카드 파일 ═══');
if (!fs.existsSync(CARDS)) {
  bad(`public/q/ 폴더가 없음`);
} else {
  const files = new Set(fs.readdirSync(CARDS).filter((f) => /\.jpe?g$/i.test(f)));
  const imgNums = [...key.entries()].filter(([, k]) => k.t === 'img').map(([n]) => n);
  const noFile = imgNums.filter((n) => !files.has(`${n}.jpg`) && !files.has(`${n}.jpeg`));
  ok(`카드 파일 ${files.size}장 발견 (이미지 문항 ${imgNums.length}개)`);
  noFile.length
    ? bad(`카드 이미지 누락 ${noFile.length}개: ${noFile.slice(0, 20).join(', ')}`)
    : ok('모든 이미지 문항에 카드 파일 존재');
  const orphan = [...files].filter((f) => !imgNums.includes(Number(f.replace(/\.jpe?g$/i, ''))));
  if (orphan.length) wrn(`쓰이지 않는 카드 파일 ${orphan.length}개: ${orphan.slice(0, 10).join(', ')}`);
  const tiny = [...files].filter((f) => fs.statSync(path.join(CARDS, f)).size < 3000);
  if (tiny.length) bad(`비정상적으로 작은 카드(깨졌을 수 있음) ${tiny.length}개: ${tiny.slice(0, 10).join(', ')}`);
}

console.log('\n═══ 6. 데이터 내용 위생 ═══');
const leak = bank.filter((q) => /정답\s*[:：]|해설\s*[:：]/.test(q.q ?? ''));
leak.length ? bad(`문제 지문에 정답/해설이 섞인 문항 ${leak.length}개: ${leak.slice(0, 10).map((q) => q.i).join(', ')}`) : ok('지문에 정답 노출 없음');

const noExp = bank.filter((q) => !q.e || q.e.trim().length < 3).map((q) => q.i);
const KNOWN_NO_EXP = [418, 643, 964]; // 원본 PDF에 해설이 없는 문항
const unexpected = noExp.filter((n) => !KNOWN_NO_EXP.includes(n));
unexpected.length
  ? bad(`예상 외로 해설이 빈 문항 ${unexpected.length}개: ${unexpected.slice(0, 15).join(', ')}`)
  : ok(`해설 누락은 알려진 3문항(${KNOWN_NO_EXP.join(', ')})뿐`);

const emptyQ = bank.filter((q) => q.t === 'text' && (!q.q || q.q.length < 5)).map((q) => q.i);
emptyQ.length ? bad(`지문이 빈 문장형 문항: ${emptyQ.slice(0, 15).join(', ')}`) : ok('문장형 지문 전부 존재');

const emptyC = bank.filter((q) => q.t === 'text' && (q.c ?? []).some((c) => !c || c.trim().length < 1)).map((q) => q.i);
emptyC.length ? bad(`보기가 빈 문항: ${emptyC.slice(0, 15).join(', ')}`) : ok('보기 텍스트 전부 존재');

const oob = bank.filter((q) => (q.a ?? []).some((a) => a < 1 || a > (q.t === 'text' ? (q.c?.length ?? 4) : (q.nc ?? 4)))).map((q) => q.i);
oob.length ? bad(`정답 번호가 보기 범위를 벗어난 문항: ${oob.slice(0, 15).join(', ')}`) : ok('정답 번호 범위 정상');

console.log('\n' + '═'.repeat(46));
if (fail.length === 0) {
  console.log(`🎉 검증 통과! 실패 0건${warn.length ? `, 경고 ${warn.length}건` : ''}`);
  process.exit(0);
} else {
  console.log(`💥 검증 실패 ${fail.length}건${warn.length ? `, 경고 ${warn.length}건` : ''} — 위 ❌ 항목을 수정할 것`);
  process.exit(1);
}
