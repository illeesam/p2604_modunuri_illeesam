package com.shopjoy.ecadminapi.base.sy.constant;

import java.util.List;

/**
 * sy_attach.ref_table_nm 값 상수 — 어떤 도메인이 첨부를 물고 있는지 식별하는 키.
 * 첨부 저장(연계 반영)·목록/상세 조회(첨부 목록 주입) 양쪽 모두 이 상수를 사용한다.
 * 신규 도메인 추가 시 여기 상수를 추가하고, {@code _doc/정책서/sy/sy.14.파일첨부.md}
 * §ref_table_nm 명명 규칙 표 + {@code SyAttachMng.js} 의 REF_TABLE_OPTS 도 함께 갱신한다.
 *
 * <p>⚠️ {@code pd_prod_content} 는 여기 없다 — 의도적으로 절대 연계하지 않는 값이라(§10-B)
 * 상수화하지 않는다. 상수가 있으면 "이건 써도 되는 값"으로 오인해 연계 코드에 쓰일 위험이 있다.</p>
 */
public class SyAttachRefTableConst {

    public static final String SY_NOTICE          = "sy_notice";
    public static final String SY_BBS              = "sy_bbs";
    public static final String CM_FAQ              = "cm_faq";
    public static final String CM_CHATT_MSG        = "cm_chatt_msg";

    /** sy_contact 는 첨부 슬롯이 2개(문의내용/답변)라 논리 슬롯명을 쓴다 — 실제 테이블명 아님. ref_id 는 둘 다 contact_id 공용. */
    public static final String SY_CONTACT_CONTENT  = "sy_contact_content";
    public static final String SY_CONTACT_ANSWER   = "sy_contact_answer";

    /** pd_prod_img 는 1행=첨부 1건(1:1) — ref_id=prod_img_id. 정방향(pd_prod_img.attach_id)도 같이 채운다(§10-B). */
    public static final String PD_PROD_IMG         = "pd_prod_img";

    /**
     * 값+라벨 목록 — {@code GET /co/cm/upload/ref/table-options} 로 프론트에 그대로 내려준다.
     * 프론트는 이 목록에서 {@code key} 로 자기 화면에 해당하는 항목을 찾아 {@code value} 를
     * {@code <base-attach-grp :ref-table-nm>} 에 그대로 꽂는다 — 프론트에 문자열을 손으로 다시
     * 타이핑하지 않게 하기 위함(2026-08-15).
     */
    public static final List<SyAttachRefTableOption> OPTIONS = List.of(
        new SyAttachRefTableOption("NOTICE",           SY_NOTICE,          "공지사항"),
        new SyAttachRefTableOption("BBS",               SY_BBS,             "게시글"),
        new SyAttachRefTableOption("CONTACT_CONTENT",  SY_CONTACT_CONTENT, "문의 내용"),
        new SyAttachRefTableOption("CONTACT_ANSWER",   SY_CONTACT_ANSWER,  "문의 답변"),
        new SyAttachRefTableOption("FAQ",               CM_FAQ,             "FAQ 답변"),
        new SyAttachRefTableOption("CHATT_MSG",        CM_CHATT_MSG,       "채팅 메시지"),
        new SyAttachRefTableOption("PROD_IMG",         PD_PROD_IMG,        "상품 이미지")
    );

    private SyAttachRefTableConst() {}
}
