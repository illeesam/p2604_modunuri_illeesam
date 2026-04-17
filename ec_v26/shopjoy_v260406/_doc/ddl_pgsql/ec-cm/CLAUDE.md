# ec-cm/ 커뮤니티 도메인 DDL

## 테이블 목록

### 게시판
- `cm_bltn` — 게시글 마스터 (PK: bltn_id, FK: bltn_cate_id)
- `cm_bltn_cate` — 게시판 카테고리 (PK: bltn_cate_id, 계층 가능)
- `cm_bltn_file` — 게시글 첨부파일 (FK: bltn_id, sort_no)
- `cm_bltn_good` — 게시글 좋아요 (UNIQUE: bltn_id + member_id)
- `cm_bltn_reply` — 게시글 댓글 (FK: bltn_id, parent_reply_id 자기참조)
- `cm_bltn_tag` — 게시글 태그 연결 (FK: bltn_id + tag_nm)

### 채팅
- `cm_chatt_room` — 채팅방 (PK: chatt_room_id, FK: member_id)
- `cm_chatt_msg` — 채팅 메시지 (PK: chatt_msg_id, FK: chatt_room_id)

### 로그/경로
- `cm_push_log` — 푸시 발송 로그 *(log 예외: 단일 단어 컬럼 허용)*
- `cm_path` — 경로 마스터 (path_remark)

## 컬럼명 주의
- 제목: `bltn_title`
- 내용: `bltn_content`
- 조회수: `bltn_view_cnt`
- 좋아요수: `bltn_good_cnt`

## 관련 정책서
- 커뮤니티 전용 정책서 없음 (시스템 공통 정책 적용)
- 게시판 구조 참조: `_doc/정책서sy/sy.09.프로그램설계정책.md`
