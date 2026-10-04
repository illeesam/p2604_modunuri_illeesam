-- 알림함 (수신자별 알림 1건 = 1행)
-- 2026-10-04 용어 보정 alarm→noti: 옛 sy_noti (migration_20261004_noti_rename.sql), site_id·tenant_modules 는 migration_20261004_noti_fcm_push.sql
-- BO(관리자 사용자)·FO(쇼핑몰 회원) 가 같은 테이블을 공유하고 recv_type_cd 로 구분한다.
-- 수신자 1명 = 1행 — 각자 읽음 상태를 따로 관리해야 하므로 공유 행을 두지 않는다.
CREATE TABLE shopjoy_2604.ap_fcm_noti (
    noti_id       VARCHAR(21)  NOT NULL CONSTRAINT ap_fcm_noti_pk_noti_id PRIMARY KEY,
    reg_site_id   VARCHAR(21)  NOT NULL,
    recv_type_cd  VARCHAR(20)  NOT NULL,
    recv_id       VARCHAR(21)  NOT NULL,
    recv_nm       VARCHAR(100),
    noti_type_cd  VARCHAR(20)  NOT NULL DEFAULT 'ALARM',
    channel_cd    VARCHAR(20),
    noti_title    VARCHAR(300) NOT NULL,
    noti_content  TEXT,
    link_page     VARCHAR(100),
    ref_id        VARCHAR(21),
    read_yn       VARCHAR(1)   DEFAULT 'N',
    read_date     TIMESTAMP,
    reg_by        VARCHAR(30),
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30),
    upd_date      TIMESTAMP,
    site_id       VARCHAR(21),
    tenant_modules VARCHAR(200)
);

CREATE INDEX ap_fcm_noti_ix01_recv_id_x2 ON shopjoy_2604.ap_fcm_noti (recv_type_cd, recv_id);
CREATE INDEX ap_fcm_noti_ix02_reg_date    ON shopjoy_2604.ap_fcm_noti (reg_date DESC);
CREATE INDEX ap_fcm_noti_ix_recv          ON shopjoy_2604.ap_fcm_noti (recv_type_cd, recv_id, site_id, read_yn);

COMMENT ON TABLE  shopjoy_2604.ap_fcm_noti              IS '알림함 (수신자별 알림 1건 = 1행)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.noti_id      IS '알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.reg_site_id  IS '등록사이트ID';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.recv_type_cd IS '수신자유형 (MEMBER: 쇼핑몰 회원 / USER: 관리자 사용자)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.recv_id      IS '수신자ID (MEMBER=mb_member.member_id / USER=sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.recv_nm      IS '수신자명 (발송 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.noti_type_cd IS '알림유형 (NOTICE: 공지사항 / ALARM: 수신알림 / SPECIAL: 특이사항)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.channel_cd   IS '발송채널 (mail/sms/kakao/chat/notice)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.noti_title   IS '알림 제목';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.noti_content IS '알림 내용';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.link_page    IS '클릭 시 이동할 화면 pageId';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.ref_id       IS '참조ID (공지ID/주문ID 등)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.read_yn      IS '읽음여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.read_date    IS '읽은일시';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.reg_by       IS '등록자';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.reg_date     IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.upd_by       IS '수정자';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.upd_date     IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.site_id      IS '사이트ID (sy_site.site_id) - 알림이 속한 사이트(회원 알림=그 회원의 사이트)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.tenant_modules IS '대상 FO 모듈 목록(콤마 구분, 예 ec1,ec2) - NULL/빈값=사이트 전체';
