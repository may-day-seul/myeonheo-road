"""문항을 7개 학습 영역으로 분류해 src/data/categories.json 을 만든다.

bank.json에는 영역 정보가 없고, 대체 신호도 마땅치 않다.
  - 해설의 법령명은 656/1000이 '도로교통법' 하나라 뭉뚱그려진다
  - 조문 번호는 449문항에만 있다
  - 문항 번호도 주제순이 아니다
따라서 지문·보기·해설의 어휘로 분류한다. 근사치이며 애매하면 'etc'로 둔다.

bank.json은 건드리지 않는다. 데이터 패치 v2로 정합성이 맞춰졌고
verify/verify.mjs의 검사 대상이므로 영역 정보는 별도 파일로 뺀다.

사용법: python3 tools/build-categories.py [--sample]
"""

import json
import random
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = json.loads((ROOT / 'src/data/bank.json').read_text())
OUT = ROOT / 'src/data/categories.json'

# (코드, 이름, 핵심어 3점, 보조어 1점)
CATS = [
    (
        'sign',
        '표지·신호',
        ['안전표지', '노면표시', '표지판', '규제표지', '지시표지', '주의표지',
         '보조표지', '노면전차전용', '신호등', '신호기', '등화', '수신호',
         '점멸', '차량신호', '보행신호'],
        ['화살표', '황색', '적색', '녹색', '점선', '실선', '신호', '표지'],
    ),
    (
        'walk',
        '보행자·보호구역',
        ['보행자', '횡단보도', '보호구역', '어린이통학버스', '통학버스',
         '어린이보호', '노인보호', '장애인보호', '실버존', '스쿨존',
         '보행자전용', '무단횡단'],
        ['어린이', '노인', '유아', '횡단', '통학'],
    ),
    (
        'drive',
        '통행방법·교차로',
        ['교차로', '회전교차로', '앞지르기', '진로변경', '차로변경', '끼어들기',
         '유턴', '중앙선', '주정차', '주차금지', '정차금지', '견인',
         '일방통행', '통행우선', '양보운전', '진로양보', '긴급자동차',
         '경음기', '방향지시등'],
        ['차로', '통행', '좌회전', '우회전', '진로', '주차', '정차', '양보',
         '일시정지', '안전지대',
         '자전거', '이륜차', '원동기장치자전거', '개인형이동장치',
         '화물자동차', '건설기계', '노면전차'],
    ),
    (
        'speed',
        '속도·안전운전',
        ['제한속도', '최고속도', '최저속도', '안전거리', '서행', '감속',
         '과속', '제동거리', '공주거리', '정지거리', '고속도로',
         '자동차전용도로', '갓길', '터널', '야간', '빗길', '눈길', '결빙',
         '안개', '수막현상', '블랙아이스', '졸음', '방어운전',
         '난폭운전', '보복운전', '안전운전', '운전자세'],
        ['속도', '킬로미터', '시야', '미끄러', '하이패스'],
    ),
    (
        'license',
        '면허·음주·처벌',
        ['운전면허', '적성검사', '면허증', '벌점', '행정처분', '면허취소',
         '정지처분', '누산점수', '범칙금', '과태료', '음주운전', '혈중알코올',
         '음주측정', '주취', '약물', '방지장치', '국제운전면허', '연습운전',
         '벌금', '징역'],
        ['면허', '처분', '단속', '위반', '음주', '취소', '갱신'],
    ),
    (
        'accident',
        '사고·응급조치',
        ['교통사고', '특례법', '뺑소니', '구호조치', '응급처치', '심폐소생',
         '중상해', '사상자', '사고발생', '보험', '공제', '합의', '피해자',
         '2차사고'],
        ['사고', '신고', '부상', '사망', '삼각대'],
    ),
    (
        'car',
        '자동차·장치',
        ['타이어', '엔진', '배터리', '전조등', '제동장치', '조향장치',
         '안전띠', '안전벨트', '에어백', '친환경', '전기자동차', '수소',
         '연료', '점검', '정비', '자동차관리법', '튜닝', '적재',
         '승차정원', '경제운전', '고압가스', '냉각수'],
        ['장치', '부품', '오일', '연비', '적재물', '검사'],
    ),
]

NAMES = {c[0]: c[1] for c in CATS}
NAMES['etc'] = '기타'


def parts(q):
    head = ' '.join([q.get('q') or '', ' '.join(q.get('c') or [])])
    return head.replace(' ', ''), (q.get('e') or '').replace(' ', '')


# (키워드, 영역, 기본가중치). 긴 키워드부터 매칭해 소진시키기 위해 길이순 정렬.
KEYWORDS = sorted(
    [(kw, code, 3) for code, _n, primary, _s in CATS for kw in primary]
    + [(kw, code, 1) for code, _n, _p, secondary in CATS for kw in secondary],
    key=lambda t: -len(t[0]),
)


def score_text(text, mult, scores):
    """긴 키워드부터 세고 매칭 구간을 지운다.

    '보행자'와 '보행', '제한속도'와 '속도'처럼 짧은 말이 긴 말에 포함되면
    한 구간이 두 번 계산돼 점수가 부풀려진다. 매칭한 자리를 공백으로 덮어
    같은 글자가 다시 세어지지 않게 한다.
    """
    for kw, code, w in KEYWORDS:
        if kw not in text:
            continue
        n = text.count(kw)
        scores[code] += w * mult * n
        text = text.replace(kw, ' ' * len(kw))
    return text


def classify(q):
    """지문·보기는 해설의 2배로 본다. 주제를 정의하는 건 지문이기 때문."""
    head, expl = parts(q)
    scores = dict.fromkeys(NAMES, 0)
    score_text(head, 2, scores)
    score_text(expl, 1, scores)
    scores.pop('etc')
    code, best = max(scores.items(), key=lambda kv: kv[1])
    return code if best > 0 else 'etc'


def main():
    result = {q['i']: classify(q) for q in BANK}
    dist = Counter(result.values())

    print('영역 분포:')
    for code, _n, _p, _s in CATS:
        n = dist.get(code, 0)
        print(f'  {n:4d}  {code:9s} {NAMES[code]}')
    etc = dist.get('etc', 0)
    print(f'  {etc:4d}  etc       기타  ({etc / len(BANK) * 100:.1f}%)')

    if '--sample' in sys.argv:
        random.seed(11)
        print('\n영역별 표본:')
        for code, _n, _p, _s in CATS:
            ids = [i for i, c in result.items() if c == code]
            print(f'\n── {NAMES[code]} ({len(ids)}문항)')
            for i in random.sample(ids, min(5, len(ids))):
                q = next(x for x in BANK if x['i'] == i)
                txt = q.get('q') or ('[이미지] ' + q['e'][:60])
                print(f'   #{i:4d} {txt[:72]}')

    OUT.write_text(json.dumps(result, ensure_ascii=False))
    print(f'\n{OUT.relative_to(ROOT)} 저장 ({len(result)}문항)')


if __name__ == '__main__':
    main()
