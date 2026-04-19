# ec-cm/ 커뮤니티 도메인 DDL

## SQL 파일 목록

### 게시판
- `cm_bltn.sql` — 게시글 마스터 (PK: bltn_id, FK: bltn_cate_id)
- `cm_bltn_cate.sql` — 게시판 카테고리 (PK: bltn_cate_id, 계층 가능)
- `cm_bltn_file.sql` — 게시글 첨부파일 (FK: bltn_id, sort_no)
- `cm_bltn_good.sql` — 게시글 좋아요 (UNIQUE: bltn_id + member_id)
- `cm_bltn_reply.sql` — 게시글 댓글 (FK: bltn_id, parent_reply_id 자기참조)
- `cm_bltn_tag.sql` — 게시글 태그 연결 (FK: bltn_id + tag_nm)

### 채팅
- `cm_chatt_room.sql` — 채팅방 (PK: chatt_room_id, FK: member_id)
- `cm_chatt_msg.sql` — 채팅 메시지 (PK: chatt_msg_id, FK: chatt_room_id)

### 로그/경로
- `cmh_push_log.sql` — 푸시 발송 로그 *(log 예외)*
- `cm_path.sql` — 경로 마스터 (path_remark)

## 컬럼명 주의
- 제목: `bltn_title`
- 내용: `bltn_content`
- 조회수: `bltn_view_cnt`
- 좋아요수: `bltn_good_cnt`

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `cmChattMng` | 고객센터 > 채팅관리 | cm_chatt_room, cm_chatt_msg |
| `cmNoticeMng` | 시스템 > 공지사항관리 | sy_notice (공지는 sy_notice 사용) |
| `syBbsMng` | 시스템 > 게시글관리 | cm_bltn, cm_bltn_cate, cm_bltn_file, cm_bltn_reply |
| `syBbmMng` | 시스템 > 게시판관리 | cm_bltn_cate |

## 관련 정책서
- 커뮤니티 전용 정책서 없음 (시스템 공통 정책 적용)
- 참조: `_doc/정책서sy/sy.09.프로그램설계정책.md`
