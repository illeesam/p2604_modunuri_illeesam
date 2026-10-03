"""
migration_20261003_zd_meta_tables.py — 운영지원 > DB메타관리 테이블 4개 신설 (2026-10-03)

  zd_meta_word      표준 단어사전
  zd_meta_domain    표준 도메인
  zd_meta_term      표준 용어사전
  zd_meta_snapshot  스키마 스냅샷

새 테이블만 만든다(기존 테이블·데이터는 건드리지 않음). 이미 있으면 건너뛴다(여러 번 실행해도 안전).
DDL 원본은 같은 폴더 sy/zd_meta_*.sql — 이 스크립트는 그 파일을 그대로 읽어 실행한다.

사용법 (DB 비밀번호는 실행할 때만 환경변수로):
  PowerShell:  $env:DB_PASSWORD='…'; python migration_20261003_zd_meta_tables.py dry
               $env:DB_PASSWORD='…'; python migration_20261003_zd_meta_tables.py run
  dry    — 만들 테이블/이미 있는 테이블만 보여 준다
  run    — 없는 테이블을 한 트랜잭션으로 생성 + 결과 확인
  revert — 4개 테이블 삭제(데이터 포함). 되돌릴 때만.
"""
import os, sys, pathlib, psycopg2

S = "shopjoy_2604"
TABLES = ["zd_meta_word", "zd_meta_domain", "zd_meta_term", "zd_meta_snapshot"]
HERE = pathlib.Path(__file__).resolve().parent


def conn():
    return psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                            dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                            password=os.environ["DB_PASSWORD"])


def existing(cur):
    cur.execute("select table_name from information_schema.tables where table_schema=%s and table_name = any(%s)", (S, TABLES))
    return {r[0] for r in cur.fetchall()}


def main(mode):
    c = conn(); cur = c.cursor()
    have = existing(cur)
    todo = [t for t in TABLES if t not in have]
    print(f"[확인] 이미 있음: {sorted(have) or '없음'} / 새로 만들 것: {todo or '없음'}")
    if mode == "dry":
        return
    if mode == "revert":
        for t in TABLES:
            cur.execute(f"DROP TABLE IF EXISTS {S}.{t}")
        c.commit(); print("[되돌림] 4개 테이블 삭제 완료"); return
    if mode != "run":
        print("사용법: dry | run | revert"); return
    try:
        for t in todo:
            sql = (HERE / "sy" / f"{t}.sql").read_text(encoding="utf-8")
            cur.execute(sql)
            print(f"[생성] {t}")
        c.commit()
    except Exception as e:
        c.rollback(); print("[실패 — 롤백]", e); sys.exit(1)
    for t in TABLES:
        cur.execute("select count(*) from information_schema.columns where table_schema=%s and table_name=%s", (S, t))
        print(f"[결과] {t}: 컬럼 {cur.fetchone()[0]}개")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "dry")
