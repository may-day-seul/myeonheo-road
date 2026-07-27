"""이미지 문항 카드의 보기(①~⑤) 개수를 검출한다.

bank.json의 nc가 전부 4로 들어와 있지만 실제로는 5지선다 문항이 섞여 있다
(정답에 5번이 있는 68문항이 그 증거). 카드에서 원문자를 직접 읽어 바로잡는다.

모든 카드가 같은 PDF에서 같은 배율로 크롭되어 원문자 글리프의 모양·크기가
동일하다. 그래서 기하 휴리스틱 대신 글리프 템플릿 매칭을 쓴다.
템플릿은 5지선다가 확실한 #683(정답 [1,5])의 보기 줄에서 뽑는다.
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BANK_PATH = ROOT / 'src/data/bank.json'
DIR = ROOT / 'public/q'

BANK = json.loads(BANK_PATH.read_text())
IMGS = [q for q in BANK if q['t'] == 'img']

THRESH = 190
LEFT, RIGHT = 25, 300
GLYPH_W = 16


def binarize(path):
    return np.asarray(Image.open(path).convert('L')) < THRESH


def text_lines(dark):
    rows = dark[:, LEFT:RIGHT].any(axis=1)
    out, y, H = [], 0, len(rows)
    while y < H:
        if rows[y]:
            y0 = y
            while y < H and rows[y]:
                y += 1
            if 8 <= y - y0 <= 26:
                out.append((y0, y))
        else:
            y += 1
    return out


def glyph_candidates(dark, y0, y1, x_from=LEFT, x_to=878):
    """줄에서 글자 시작 위치마다 글리프 비트맵을 잘라 순서대로 돌려준다.

    보기가 세로로 쌓인 카드뿐 아니라 '① 1  ② 2  ③ 3  ④ 5'처럼
    한 줄에 가로로 늘어선 카드(#262 등)도 있어 줄 전체를 훑는다.
    """
    sub = dark[max(0, y0 - 3) : y1 + 3, x_from:x_to]
    cols = sub.any(axis=0)
    out = []
    x = 0
    W = len(cols)
    while x < W:
        if cols[x]:
            g = sub[:, x : x + GLYPH_W]
            ys2, xs2 = np.where(g)
            if len(ys2):
                out.append(g[ys2.min() : ys2.max() + 1, xs2.min() : xs2.max() + 1])
            # 다음 글자 시작까지 건너뛴다(공백 4px 이상)
            x += 1
            gap = 0
            while x < W and gap < 4:
                gap = gap + 1 if not cols[x] else 0
                x += 1
        else:
            x += 1
    return out


def similarity(a, b):
    """두 비트맵의 Jaccard 유사도. 크기가 다르면 큰 쪽에 맞춰 패딩한다."""
    h = max(a.shape[0], b.shape[0])
    w = max(a.shape[1], b.shape[1])
    if abs(a.shape[0] - b.shape[0]) > 3 or abs(a.shape[1] - b.shape[1]) > 3:
        return 0.0
    best = 0.0
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            pa = np.zeros((h + 2, w + 2), bool)
            pb = np.zeros((h + 2, w + 2), bool)
            pa[1 : 1 + a.shape[0], 1 : 1 + a.shape[1]] = a
            y, x = 1 + dy, 1 + dx
            pb[y : y + b.shape[0], x : x + b.shape[1]] = b
            inter = (pa & pb).sum()
            union = (pa | pb).sum()
            if union:
                best = max(best, inter / union)
    return best


def seed_templates():
    """#683(5지선다 확정)의 보기 줄에서 ①~⑤ 글리프를 하나씩 뽑는다."""
    dark = binarize(DIR / '683.jpg')
    lines = text_lines(dark)
    tpl = {}
    for n, (y0, y1) in enumerate(lines[1:6], start=1):
        cands = glyph_candidates(dark, y0, y1)
        assert cands, n
        tpl[n] = [cands[0]]
    return tpl


def build_templates():
    """씨앗 템플릿으로 확신도 높은 카드를 골라 번호별 표본을 늘린다.

    한 카드에서 뽑은 글리프 하나로는 JPEG 노이즈 때문에 경계에서 흔들린다
    (실제 ①이 0.43인데 다른 글자가 0.48로 나오는 식). 여러 카드의 표본을
    모아 그중 최대 유사도를 쓰면 안정된다.
    """
    tpl = seed_templates()
    # 정답에 5번이 있는 문항 = 5지선다 확정. 여기서 표본을 모은다.
    truth5 = [q['i'] for q in IMGS if max(q['a']) == 5]
    for i in truth5[:40]:
        dark = binarize(DIR / f'{i}.jpg')
        picked, n = {}, 0
        for y0, y1 in text_lines(dark):
            for g in glyph_candidates(dark, y0, y1):
                nxt = n + 1
                if nxt > 5:
                    break
                if match(g, tpl[nxt]) >= 0.55:  # 확신도 높은 것만
                    picked[nxt] = g
                    n = nxt
        if n == 5:  # ①~⑤가 모두 깔끔히 잡힌 카드만 채택
            for k, g in picked.items():
                if len(tpl[k]) < 12:
                    tpl[k].append(g)
    return tpl


def match(g, exemplars):
    return max(similarity(g, t) for t in exemplars)


def read_markers(path, tpl, expect_sim=0.45):
    """보기 번호를 ①부터 순서대로 따라가며 센다.

    5지선다 카드의 ⑤는 ③과 모양이 비슷해 5지 분류는 흔들린다. 대신 보기가
    반드시 ①②③④(⑤) 순서라는 점을 이용해, '다음에 와야 할 번호'
    템플릿 하나와만 비교한다(1:1 비교라 훨씬 안정적이다).
    보기 텍스트가 접혀 생긴 이어지는 줄은 어느 템플릿과도 맞지 않아 건너뛴다.
    """
    dark = binarize(path)
    n = 0
    for y0, y1 in text_lines(dark):
        for g in glyph_candidates(dark, y0, y1):
            nxt = n + 1
            if nxt > 5:
                break
            if match(g, tpl[nxt]) >= expect_sim:
                n = nxt
        if n >= 5:
            break
    return list(range(1, n + 1))


def main():
    tpl = build_templates()
    counts = {q['i']: max(read_markers(DIR / f"{q['i']}.jpg", tpl)) for q in IMGS}

    from collections import Counter

    print('검출된 보기 개수 분포:', sorted(Counter(counts.values()).items()))

    # 안전장치: 정답 번호는 항상 고를 수 있어야 한다
    bad = [q['i'] for q in IMGS if max(q['a']) > counts[q['i']]]
    if bad:
        print(f'경고: 정답번호가 검출개수를 넘는 문항 {len(bad)}개 -> 정답 기준으로 올림')
        for i in bad:
            counts[i] = max(counts[i], max(next(q for q in IMGS if q['i'] == i)['a']))

    changed = 0
    for q in BANK:
        if q['t'] != 'img':
            continue
        n = counts[q['i']]
        if q.get('nc') != n:
            q['nc'] = n
            changed += 1

    BANK_PATH.write_text(json.dumps(BANK, ensure_ascii=False))
    print(f'bank.json 갱신: {changed}문항의 nc 수정')


if __name__ == '__main__':
    main()
