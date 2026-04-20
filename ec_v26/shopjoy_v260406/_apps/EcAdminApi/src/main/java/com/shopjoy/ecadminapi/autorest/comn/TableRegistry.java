package com.shopjoy.ecadminapi.autorest.comn;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TableRegistry {

    private final Map<String, TableConfig> registry = new HashMap<>();

    // Full whitelist of allowed table names (prevents SQL injection)
    private static final Set<String> ALLOWED_TABLES = Set.of(
        // ec - 게시판/채팅
        "cm_bltn_cate", "cm_bltn_file", "cm_bltn_good", "cm_bltn_reply", "cm_bltn_tag", "cm_bltn",
        "cm_chatt_msg", "cm_chatt_room", "cm_path",
        // ec - 전시
        "dp_area_panel", "dp_area", "dp_panel_item", "dp_panel", "dp_ui_area", "dp_ui",
        "dp_widget_lib", "dp_widget",
        // ec - 회원
        "mb_dvc_token", "mb_like", "mb_member_addr", "mb_member_grade", "mb_member_group",
        "mb_member", "mb_sns_member",
        // ec - 주문
        "od_cart", "od_claim_item", "od_claim", "od_dliv_item", "od_dliv",
        "od_order_discnt", "od_order_item_discnt", "od_order_item", "od_order",
        "od_pay_method", "od_pay", "od_refund_method", "od_refund",
        // ec - 상품
        "pd_category_prod", "pd_category", "pd_dliv_tmplt", "pd_prod_bundle_item",
        "pd_prod_content", "pd_prod_img", "pd_prod_opt_item", "pd_prod_opt",
        "pd_prod_qna", "pd_prod_rel", "pd_prod_set_item", "pd_prod_sku", "pd_prod_tag",
        "pd_prod", "pd_restock_noti", "pd_review_attach", "pd_review_comment",
        "pd_review", "pd_tag",
        // ec - 프로모션
        "pm_cache", "pm_coupon_issue", "pm_coupon_item", "pm_coupon_usage", "pm_coupon",
        "pm_discnt_item", "pm_discnt_usage", "pm_discnt", "pm_event_benefit", "pm_event_item",
        "pm_event", "pm_gift_cond", "pm_gift_issue", "pm_gift", "pm_plan_item", "pm_plan",
        "pm_save_issue", "pm_save_usage", "pm_save", "pm_voucher_issue", "pm_voucher",
        // ec - 정산
        "st_erp_voucher_line", "st_erp_voucher", "st_recon", "st_settle_adj",
        "st_settle_close", "st_settle_config", "st_settle_etc_adj", "st_settle_item",
        "st_settle_pay", "st_settle_raw", "st_settle",
        // sy
        "sy_alarm", "sy_attach_grp", "sy_attach", "sy_batch", "sy_bbm", "sy_bbs",
        "sy_brand", "sy_code_grp", "sy_code", "sy_contact", "sy_dept", "sy_i18n_msg",
        "sy_i18n", "sy_menu", "sy_notice", "sy_path", "sy_prop", "sy_role_menu",
        "sy_role", "sy_site", "sy_template", "sy_user_role", "sy_user",
        "sy_vendor_brand", "sy_vendor_content", "sy_vendor_user", "sy_vendor", "sy_voc"
    );

    // Column name whitelist pattern (only letters, digits, underscore)
    private static final java.util.regex.Pattern SAFE_IDENTIFIER =
        java.util.regex.Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]*$");

    @PostConstruct
    public void init() {
        // ─── SY domain ───────────────────────────────────────────────
        register("sy_user", TableConfig.builder()
            .pkColumn("user_id")
            .requiredFields(List.of("login_id", "user_nm", "user_password"))
            .cdFields(Map.of(
                "user_status_cd", "USER_STATUS",
                "auth_method_cd", "AUTH_METHOD"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "dept_id", "sy_dept",
                "role_id", "sy_role"))
            .searchFields(List.of("login_id", "user_nm", "user_email", "user_phone"))
            .build());

        register("sy_site", TableConfig.builder()
            .pkColumn("site_id")
            .requiredFields(List.of("site_nm"))
            .searchFields(List.of("site_nm", "site_domain"))
            .build());

        register("sy_code", TableConfig.builder()
            .pkColumn("code_id")
            .requiredFields(List.of("code_grp", "code_value", "code_label"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("code_grp", "code_value", "code_label"))
            .build());

        register("sy_code_grp", TableConfig.builder()
            .pkColumn("code_grp_id")
            .requiredFields(List.of("code_grp", "code_grp_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("sy_code"))
            .searchFields(List.of("code_grp", "code_grp_nm"))
            .build());

        register("sy_dept", TableConfig.builder()
            .pkColumn("dept_id")
            .requiredFields(List.of("dept_nm"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "parent_dept_id", "sy_dept"))
            .searchFields(List.of("dept_nm", "dept_remark"))
            .build());

        register("sy_role", TableConfig.builder()
            .pkColumn("role_id")
            .requiredFields(List.of("role_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("sy_role_menu"))
            .searchFields(List.of("role_nm", "role_remark"))
            .build());

        register("sy_role_menu", TableConfig.builder()
            .pkColumn("role_menu_id")
            .requiredFields(List.of("role_id", "menu_id"))
            .fkFields(Map.of(
                "role_id", "sy_role",
                "menu_id", "sy_menu"))
            .build());

        register("sy_menu", TableConfig.builder()
            .pkColumn("menu_id")
            .requiredFields(List.of("menu_nm"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "parent_menu_id", "sy_menu"))
            .searchFields(List.of("menu_nm", "menu_url", "menu_remark"))
            .build());

        register("sy_bbm", TableConfig.builder()
            .pkColumn("bbm_id")
            .requiredFields(List.of("bbm_cd", "bbm_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("sy_bbs"))
            .searchFields(List.of("bbm_cd", "bbm_nm", "bbm_remark"))
            .build());

        register("sy_bbs", TableConfig.builder()
            .pkColumn("bbs_id")
            .requiredFields(List.of("bbm_id", "title"))
            .fkFields(Map.of(
                "bbm_id", "sy_bbm",
                "site_id", "sy_site"))
            .childTables(List.of())
            .searchFields(List.of("title", "content"))
            .build());

        register("sy_attach_grp", TableConfig.builder()
            .pkColumn("attach_grp_id")
            .requiredFields(List.of("attach_grp_nm"))
            .childTables(List.of("sy_attach"))
            .searchFields(List.of("attach_grp_nm", "attach_grp_remark"))
            .build());

        register("sy_attach", TableConfig.builder()
            .pkColumn("attach_id")
            .requiredFields(List.of("attach_grp_id", "attach_url"))
            .fkFields(Map.of("attach_grp_id", "sy_attach_grp"))
            .searchFields(List.of("attach_url", "attach_memo"))
            .build());

        register("sy_brand", TableConfig.builder()
            .pkColumn("brand_id")
            .requiredFields(List.of("brand_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("brand_nm", "brand_remark"))
            .build());

        register("sy_vendor", TableConfig.builder()
            .pkColumn("vendor_id")
            .requiredFields(List.of("vendor_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("sy_vendor_user", "sy_vendor_brand", "sy_vendor_content"))
            .searchFields(List.of("vendor_nm"))
            .build());

        register("sy_vendor_user", TableConfig.builder()
            .pkColumn("vendor_user_id")
            .requiredFields(List.of("vendor_id", "user_id"))
            .fkFields(Map.of(
                "vendor_id", "sy_vendor",
                "user_id", "sy_user"))
            .build());

        register("sy_vendor_brand", TableConfig.builder()
            .pkColumn("vendor_brand_id")
            .requiredFields(List.of("vendor_id", "brand_id"))
            .fkFields(Map.of(
                "vendor_id", "sy_vendor",
                "brand_id", "sy_brand"))
            .build());

        register("sy_vendor_content", TableConfig.builder()
            .pkColumn("vendor_content_id")
            .requiredFields(List.of("vendor_id"))
            .fkFields(Map.of("vendor_id", "sy_vendor"))
            .build());

        register("sy_template", TableConfig.builder()
            .pkColumn("template_id")
            .requiredFields(List.of("template_nm", "template_type_cd"))
            .fkFields(Map.of("site_id", "sy_site"))
            .cdFields(Map.of("template_type_cd", "TEMPLATE_TYPE"))
            .searchFields(List.of("template_nm", "template_subject"))
            .build());

        register("sy_alarm", TableConfig.builder()
            .pkColumn("alarm_id")
            .requiredFields(List.of("alarm_title", "alarm_msg"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("alarm_title", "alarm_msg"))
            .build());

        register("sy_batch", TableConfig.builder()
            .pkColumn("batch_id")
            .requiredFields(List.of("batch_nm", "batch_type_cd"))
            .cdFields(Map.of("batch_run_status", "BATCH_STATUS"))
            .searchFields(List.of("batch_nm", "batch_memo"))
            .build());

        register("sy_notice", TableConfig.builder()
            .pkColumn("notice_id")
            .requiredFields(List.of("title", "content"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("title", "content"))
            .build());

        register("sy_contact", TableConfig.builder()
            .pkColumn("contact_id")
            .requiredFields(List.of("title", "content"))
            .fkFields(Map.of("site_id", "sy_site"))
            .cdFields(Map.of("contact_status_cd", "CONTACT_STATUS"))
            .searchFields(List.of("title", "content", "contact_email"))
            .build());

        register("sy_voc", TableConfig.builder()
            .pkColumn("voc_id")
            .requiredFields(List.of("title"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("title", "content"))
            .build());

        register("sy_prop", TableConfig.builder()
            .pkColumn("prop_id")
            .requiredFields(List.of("prop_key", "prop_val"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("prop_key", "prop_val", "prop_remark"))
            .build());

        register("sy_path", TableConfig.builder()
            .pkColumn("path_id")
            .requiredFields(List.of("path_key", "path_val"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("path_key", "path_val", "path_remark"))
            .build());

        register("sy_i18n", TableConfig.builder()
            .pkColumn("i18n_id")
            .requiredFields(List.of("i18n_key"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("sy_i18n_msg"))
            .searchFields(List.of("i18n_key"))
            .build());

        register("sy_i18n_msg", TableConfig.builder()
            .pkColumn("i18n_msg_id")
            .requiredFields(List.of("i18n_id", "locale", "msg"))
            .fkFields(Map.of("i18n_id", "sy_i18n"))
            .build());

        register("sy_user_role", TableConfig.builder()
            .pkColumn("user_role_id")
            .requiredFields(List.of("user_id", "role_id"))
            .fkFields(Map.of(
                "user_id", "sy_user",
                "role_id", "sy_role"))
            .build());

        // ─── EC - 회원 ────────────────────────────────────────────────
        register("mb_member", TableConfig.builder()
            .pkColumn("member_id")
            .requiredFields(List.of("member_nm", "member_email"))
            .cdFields(Map.of(
                "member_status_cd", "MEMBER_STATUS",
                "member_grade_cd", "MEMBER_GRADE",
                "member_gender_cd", "GENDER"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("mb_member_addr", "mb_member_grade"))
            .searchFields(List.of("member_nm", "member_email", "member_phone", "member_id"))
            .build());

        register("mb_member_addr", TableConfig.builder()
            .pkColumn("member_addr_id")
            .requiredFields(List.of("member_id", "addr_nm"))
            .fkFields(Map.of("member_id", "mb_member"))
            .build());

        register("mb_member_grade", TableConfig.builder()
            .pkColumn("member_grade_id")
            .requiredFields(List.of("grade_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("grade_nm"))
            .build());

        register("mb_member_group", TableConfig.builder()
            .pkColumn("member_group_id")
            .requiredFields(List.of("group_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("group_nm"))
            .build());

        register("mb_like", TableConfig.builder()
            .pkColumn("like_id")
            .requiredFields(List.of("member_id", "prod_id"))
            .fkFields(Map.of(
                "member_id", "mb_member",
                "prod_id", "pd_prod"))
            .build());

        register("mb_dvc_token", TableConfig.builder()
            .pkColumn("dvc_token_id")
            .requiredFields(List.of("member_id"))
            .fkFields(Map.of("member_id", "mb_member"))
            .build());

        register("mb_sns_member", TableConfig.builder()
            .pkColumn("sns_member_id")
            .requiredFields(List.of("member_id", "sns_type_cd"))
            .fkFields(Map.of("member_id", "mb_member"))
            .cdFields(Map.of("sns_type_cd", "SNS_TYPE"))
            .build());

        // ─── EC - 상품 ────────────────────────────────────────────────
        register("pd_category", TableConfig.builder()
            .pkColumn("category_id")
            .requiredFields(List.of("category_nm"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "parent_category_id", "pd_category"))
            .childTables(List.of("pd_category_prod"))
            .searchFields(List.of("category_nm"))
            .build());

        register("pd_prod", TableConfig.builder()
            .pkColumn("prod_id")
            .requiredFields(List.of("prod_nm", "prod_price"))
            .cdFields(Map.of(
                "prod_status_cd", "PROD_STATUS",
                "sale_status_cd", "SALE_STATUS",
                "disp_status_cd", "DISP_STATUS"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "brand_id", "sy_brand",
                "vendor_id", "sy_vendor",
                "category_id", "pd_category"))
            .childTables(List.of("pd_prod_img", "pd_prod_opt", "pd_prod_sku", "pd_prod_content", "pd_prod_tag"))
            .searchFields(List.of("prod_nm", "prod_id", "prod_barcode"))
            .build());

        register("pd_prod_img", TableConfig.builder()
            .pkColumn("prod_img_id")
            .requiredFields(List.of("prod_id", "img_url"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .build());

        register("pd_prod_opt", TableConfig.builder()
            .pkColumn("prod_opt_id")
            .requiredFields(List.of("prod_id", "opt_nm"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .childTables(List.of("pd_prod_opt_item"))
            .build());

        register("pd_prod_opt_item", TableConfig.builder()
            .pkColumn("prod_opt_item_id")
            .requiredFields(List.of("prod_opt_id", "opt_item_nm"))
            .fkFields(Map.of("prod_opt_id", "pd_prod_opt"))
            .build());

        register("pd_prod_sku", TableConfig.builder()
            .pkColumn("sku_id")
            .requiredFields(List.of("prod_id"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .searchFields(List.of("sku_cd", "sku_barcode"))
            .build());

        register("pd_prod_content", TableConfig.builder()
            .pkColumn("prod_content_id")
            .requiredFields(List.of("prod_id"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .build());

        register("pd_prod_tag", TableConfig.builder()
            .pkColumn("prod_tag_id")
            .requiredFields(List.of("prod_id", "tag_id"))
            .fkFields(Map.of(
                "prod_id", "pd_prod",
                "tag_id", "pd_tag"))
            .build());

        register("pd_tag", TableConfig.builder()
            .pkColumn("tag_id")
            .requiredFields(List.of("tag_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("tag_nm"))
            .build());

        register("pd_category_prod", TableConfig.builder()
            .pkColumn("category_prod_id")
            .requiredFields(List.of("category_id", "prod_id"))
            .fkFields(Map.of(
                "category_id", "pd_category",
                "prod_id", "pd_prod"))
            .build());

        register("pd_dliv_tmplt", TableConfig.builder()
            .pkColumn("dliv_tmplt_id")
            .requiredFields(List.of("dliv_tmplt_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("dliv_tmplt_nm"))
            .build());

        register("pd_prod_bundle_item", TableConfig.builder()
            .pkColumn("prod_bundle_item_id")
            .requiredFields(List.of("prod_id", "bundle_prod_id"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .build());

        register("pd_prod_set_item", TableConfig.builder()
            .pkColumn("prod_set_item_id")
            .requiredFields(List.of("prod_id", "set_prod_id"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .build());

        register("pd_prod_rel", TableConfig.builder()
            .pkColumn("prod_rel_id")
            .requiredFields(List.of("prod_id", "rel_prod_id"))
            .fkFields(Map.of("prod_id", "pd_prod"))
            .build());

        register("pd_prod_qna", TableConfig.builder()
            .pkColumn("prod_qna_id")
            .requiredFields(List.of("prod_id", "question"))
            .fkFields(Map.of(
                "prod_id", "pd_prod",
                "member_id", "mb_member"))
            .cdFields(Map.of("qna_status_cd", "QNA_STATUS"))
            .searchFields(List.of("question", "answer"))
            .build());

        register("pd_review", TableConfig.builder()
            .pkColumn("review_id")
            .requiredFields(List.of("prod_id", "member_id", "review_content"))
            .fkFields(Map.of(
                "prod_id", "pd_prod",
                "member_id", "mb_member"))
            .cdFields(Map.of("review_status_cd", "REVIEW_STATUS"))
            .childTables(List.of("pd_review_attach", "pd_review_comment"))
            .searchFields(List.of("review_content"))
            .build());

        register("pd_review_attach", TableConfig.builder()
            .pkColumn("review_attach_id")
            .requiredFields(List.of("review_id", "attach_url"))
            .fkFields(Map.of("review_id", "pd_review"))
            .build());

        register("pd_review_comment", TableConfig.builder()
            .pkColumn("review_comment_id")
            .requiredFields(List.of("review_id", "comment"))
            .fkFields(Map.of("review_id", "pd_review"))
            .build());

        register("pd_restock_noti", TableConfig.builder()
            .pkColumn("restock_noti_id")
            .requiredFields(List.of("prod_id", "member_id"))
            .fkFields(Map.of(
                "prod_id", "pd_prod",
                "member_id", "mb_member"))
            .build());

        // ─── EC - 주문 ────────────────────────────────────────────────
        register("od_order", TableConfig.builder()
            .pkColumn("order_id")
            .requiredFields(List.of("member_id"))
            .cdFields(Map.of(
                "order_status_cd", "ORDER_STATUS",
                "pay_status_cd", "PAY_STATUS"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "member_id", "mb_member"))
            .childTables(List.of("od_order_item", "od_pay", "od_dliv", "od_claim"))
            .searchFields(List.of("order_id", "rcvr_nm", "rcvr_phone"))
            .dateField("order_date")
            .build());

        register("od_order_item", TableConfig.builder()
            .pkColumn("order_item_id")
            .requiredFields(List.of("order_id", "prod_id"))
            .cdFields(Map.of("order_item_status_cd", "ORDER_ITEM_STATUS"))
            .fkFields(Map.of(
                "order_id", "od_order",
                "prod_id", "pd_prod"))
            .build());

        register("od_order_discnt", TableConfig.builder()
            .pkColumn("order_discnt_id")
            .requiredFields(List.of("order_id"))
            .fkFields(Map.of("order_id", "od_order"))
            .build());

        register("od_order_item_discnt", TableConfig.builder()
            .pkColumn("order_item_discnt_id")
            .requiredFields(List.of("order_item_id"))
            .fkFields(Map.of("order_item_id", "od_order_item"))
            .build());

        register("od_pay", TableConfig.builder()
            .pkColumn("pay_id")
            .requiredFields(List.of("order_id"))
            .cdFields(Map.of("pay_status_cd", "PAY_STATUS"))
            .fkFields(Map.of("order_id", "od_order"))
            .build());

        register("od_pay_method", TableConfig.builder()
            .pkColumn("pay_method_id")
            .requiredFields(List.of("pay_id"))
            .fkFields(Map.of("pay_id", "od_pay"))
            .build());

        register("od_refund", TableConfig.builder()
            .pkColumn("refund_id")
            .requiredFields(List.of("order_id"))
            .cdFields(Map.of("refund_status_cd", "REFUND_STATUS"))
            .fkFields(Map.of("order_id", "od_order"))
            .build());

        register("od_refund_method", TableConfig.builder()
            .pkColumn("refund_method_id")
            .requiredFields(List.of("refund_id"))
            .fkFields(Map.of("refund_id", "od_refund"))
            .build());

        register("od_dliv", TableConfig.builder()
            .pkColumn("dliv_id")
            .requiredFields(List.of("order_id"))
            .cdFields(Map.of(
                "dliv_status_cd", "DLIV_STATUS",
                "dliv_type_cd", "DLIV_TYPE"))
            .fkFields(Map.of("order_id", "od_order"))
            .childTables(List.of("od_dliv_item"))
            .searchFields(List.of("dliv_id", "invoice_no", "rcvr_nm"))
            .dateField("dliv_date")
            .build());

        register("od_dliv_item", TableConfig.builder()
            .pkColumn("dliv_item_id")
            .requiredFields(List.of("dliv_id", "order_item_id"))
            .fkFields(Map.of(
                "dliv_id", "od_dliv",
                "order_item_id", "od_order_item"))
            .build());

        register("od_claim", TableConfig.builder()
            .pkColumn("claim_id")
            .requiredFields(List.of("order_id", "claim_type_cd"))
            .cdFields(Map.of(
                "claim_status_cd", "CLAIM_STATUS",
                "claim_type_cd", "CLAIM_TYPE"))
            .fkFields(Map.of("order_id", "od_order"))
            .childTables(List.of("od_claim_item"))
            .searchFields(List.of("claim_id", "claim_reason"))
            .dateField("claim_date")
            .build());

        register("od_claim_item", TableConfig.builder()
            .pkColumn("claim_item_id")
            .requiredFields(List.of("claim_id", "order_item_id"))
            .fkFields(Map.of(
                "claim_id", "od_claim",
                "order_item_id", "od_order_item"))
            .build());

        register("od_cart", TableConfig.builder()
            .pkColumn("cart_id")
            .requiredFields(List.of("member_id", "prod_id"))
            .fkFields(Map.of(
                "member_id", "mb_member",
                "prod_id", "pd_prod"))
            .build());

        // ─── EC - 프로모션 ────────────────────────────────────────────
        register("pm_coupon", TableConfig.builder()
            .pkColumn("coupon_id")
            .requiredFields(List.of("coupon_nm"))
            .cdFields(Map.of(
                "coupon_status_cd", "COUPON_STATUS",
                "discnt_type_cd", "DISCNT_TYPE"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_coupon_item"))
            .searchFields(List.of("coupon_nm", "coupon_id"))
            .build());

        register("pm_coupon_item", TableConfig.builder()
            .pkColumn("coupon_item_id")
            .requiredFields(List.of("coupon_id"))
            .fkFields(Map.of("coupon_id", "pm_coupon"))
            .build());

        register("pm_coupon_issue", TableConfig.builder()
            .pkColumn("coupon_issue_id")
            .requiredFields(List.of("coupon_id", "member_id"))
            .cdFields(Map.of("issue_status_cd", "COUPON_ISSUE_STATUS"))
            .fkFields(Map.of(
                "coupon_id", "pm_coupon",
                "member_id", "mb_member"))
            .build());

        register("pm_coupon_usage", TableConfig.builder()
            .pkColumn("coupon_usage_id")
            .requiredFields(List.of("coupon_issue_id", "order_id"))
            .fkFields(Map.of(
                "coupon_issue_id", "pm_coupon_issue",
                "order_id", "od_order"))
            .build());

        register("pm_cache", TableConfig.builder()
            .pkColumn("cache_id")
            .requiredFields(List.of("member_id"))
            .fkFields(Map.of("member_id", "mb_member"))
            .cdFields(Map.of("cache_type_cd", "CACHE_TYPE"))
            .searchFields(List.of("cache_id", "cache_remark"))
            .build());

        register("pm_event", TableConfig.builder()
            .pkColumn("event_id")
            .requiredFields(List.of("event_nm"))
            .cdFields(Map.of("event_status_cd", "EVENT_STATUS"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_event_item", "pm_event_benefit"))
            .searchFields(List.of("event_nm", "event_id"))
            .build());

        register("pm_event_item", TableConfig.builder()
            .pkColumn("event_item_id")
            .requiredFields(List.of("event_id"))
            .fkFields(Map.of("event_id", "pm_event"))
            .build());

        register("pm_event_benefit", TableConfig.builder()
            .pkColumn("event_benefit_id")
            .requiredFields(List.of("event_id"))
            .fkFields(Map.of("event_id", "pm_event"))
            .build());

        register("pm_discnt", TableConfig.builder()
            .pkColumn("discnt_id")
            .requiredFields(List.of("discnt_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_discnt_item"))
            .searchFields(List.of("discnt_nm"))
            .build());

        register("pm_discnt_item", TableConfig.builder()
            .pkColumn("discnt_item_id")
            .requiredFields(List.of("discnt_id"))
            .fkFields(Map.of("discnt_id", "pm_discnt"))
            .build());

        register("pm_discnt_usage", TableConfig.builder()
            .pkColumn("discnt_usage_id")
            .requiredFields(List.of("discnt_id", "order_id"))
            .fkFields(Map.of(
                "discnt_id", "pm_discnt",
                "order_id", "od_order"))
            .build());

        register("pm_save", TableConfig.builder()
            .pkColumn("save_id")
            .requiredFields(List.of("save_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_save_issue"))
            .searchFields(List.of("save_nm"))
            .build());

        register("pm_save_issue", TableConfig.builder()
            .pkColumn("save_issue_id")
            .requiredFields(List.of("save_id", "member_id"))
            .fkFields(Map.of(
                "save_id", "pm_save",
                "member_id", "mb_member"))
            .build());

        register("pm_save_usage", TableConfig.builder()
            .pkColumn("save_usage_id")
            .requiredFields(List.of("save_issue_id", "order_id"))
            .fkFields(Map.of(
                "save_issue_id", "pm_save_issue",
                "order_id", "od_order"))
            .build());

        register("pm_gift", TableConfig.builder()
            .pkColumn("gift_id")
            .requiredFields(List.of("gift_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_gift_cond"))
            .searchFields(List.of("gift_nm"))
            .build());

        register("pm_gift_cond", TableConfig.builder()
            .pkColumn("gift_cond_id")
            .requiredFields(List.of("gift_id"))
            .fkFields(Map.of("gift_id", "pm_gift"))
            .build());

        register("pm_gift_issue", TableConfig.builder()
            .pkColumn("gift_issue_id")
            .requiredFields(List.of("gift_id", "member_id"))
            .fkFields(Map.of(
                "gift_id", "pm_gift",
                "member_id", "mb_member"))
            .build());

        register("pm_plan", TableConfig.builder()
            .pkColumn("plan_id")
            .requiredFields(List.of("plan_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_plan_item"))
            .searchFields(List.of("plan_nm"))
            .build());

        register("pm_plan_item", TableConfig.builder()
            .pkColumn("plan_item_id")
            .requiredFields(List.of("plan_id"))
            .fkFields(Map.of("plan_id", "pm_plan"))
            .build());

        register("pm_voucher", TableConfig.builder()
            .pkColumn("voucher_id")
            .requiredFields(List.of("voucher_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("pm_voucher_issue"))
            .searchFields(List.of("voucher_nm"))
            .build());

        register("pm_voucher_issue", TableConfig.builder()
            .pkColumn("voucher_issue_id")
            .requiredFields(List.of("voucher_id", "member_id"))
            .fkFields(Map.of(
                "voucher_id", "pm_voucher",
                "member_id", "mb_member"))
            .build());

        // ─── EC - 전시 ────────────────────────────────────────────────
        register("dp_ui", TableConfig.builder()
            .pkColumn("ui_id")
            .requiredFields(List.of("ui_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("dp_ui_area"))
            .searchFields(List.of("ui_nm"))
            .build());

        register("dp_ui_area", TableConfig.builder()
            .pkColumn("ui_area_id")
            .requiredFields(List.of("ui_id", "area_id"))
            .fkFields(Map.of(
                "ui_id", "dp_ui",
                "area_id", "dp_area"))
            .build());

        register("dp_area", TableConfig.builder()
            .pkColumn("area_id")
            .requiredFields(List.of("area_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("dp_area_panel"))
            .searchFields(List.of("area_nm", "area_cd"))
            .build());

        register("dp_area_panel", TableConfig.builder()
            .pkColumn("area_panel_id")
            .requiredFields(List.of("area_id", "panel_id"))
            .fkFields(Map.of(
                "area_id", "dp_area",
                "panel_id", "dp_panel"))
            .build());

        register("dp_panel", TableConfig.builder()
            .pkColumn("panel_id")
            .requiredFields(List.of("panel_nm"))
            .fkFields(Map.of("site_id", "sy_site"))
            .childTables(List.of("dp_panel_item"))
            .searchFields(List.of("panel_nm"))
            .build());

        register("dp_panel_item", TableConfig.builder()
            .pkColumn("panel_item_id")
            .requiredFields(List.of("panel_id"))
            .fkFields(Map.of("panel_id", "dp_panel"))
            .build());

        register("dp_widget_lib", TableConfig.builder()
            .pkColumn("widget_lib_id")
            .requiredFields(List.of("widget_lib_nm", "widget_type_cd"))
            .cdFields(Map.of("widget_type_cd", "WIDGET_TYPE"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("widget_lib_nm"))
            .build());

        register("dp_widget", TableConfig.builder()
            .pkColumn("widget_id")
            .requiredFields(List.of("widget_nm", "widget_type_cd"))
            .cdFields(Map.of("widget_type_cd", "WIDGET_TYPE"))
            .fkFields(Map.of("site_id", "sy_site"))
            .searchFields(List.of("widget_nm"))
            .build());

        // ─── EC - 게시판/채팅 ─────────────────────────────────────────
        register("cm_bltn", TableConfig.builder()
            .pkColumn("bltn_id")
            .requiredFields(List.of("bbm_id", "title"))
            .fkFields(Map.of(
                "bbm_id", "sy_bbm",
                "member_id", "mb_member"))
            .childTables(List.of("cm_bltn_file", "cm_bltn_reply", "cm_bltn_tag", "cm_bltn_good"))
            .searchFields(List.of("title", "content"))
            .build());

        register("cm_bltn_cate", TableConfig.builder()
            .pkColumn("bltn_cate_id")
            .requiredFields(List.of("bbm_id", "cate_nm"))
            .fkFields(Map.of("bbm_id", "sy_bbm"))
            .build());

        register("cm_bltn_file", TableConfig.builder()
            .pkColumn("bltn_file_id")
            .requiredFields(List.of("bltn_id", "file_url"))
            .fkFields(Map.of("bltn_id", "cm_bltn"))
            .build());

        register("cm_bltn_good", TableConfig.builder()
            .pkColumn("bltn_good_id")
            .requiredFields(List.of("bltn_id", "member_id"))
            .fkFields(Map.of(
                "bltn_id", "cm_bltn",
                "member_id", "mb_member"))
            .build());

        register("cm_bltn_reply", TableConfig.builder()
            .pkColumn("bltn_reply_id")
            .requiredFields(List.of("bltn_id", "reply_content"))
            .fkFields(Map.of("bltn_id", "cm_bltn"))
            .build());

        register("cm_bltn_tag", TableConfig.builder()
            .pkColumn("bltn_tag_id")
            .requiredFields(List.of("bltn_id", "tag_nm"))
            .fkFields(Map.of("bltn_id", "cm_bltn"))
            .build());

        register("cm_chatt_room", TableConfig.builder()
            .pkColumn("chatt_room_id")
            .requiredFields(List.of("member_id"))
            .cdFields(Map.of("chatt_status_cd", "CHATT_STATUS"))
            .fkFields(Map.of(
                "site_id", "sy_site",
                "member_id", "mb_member"))
            .childTables(List.of("cm_chatt_msg"))
            .searchFields(List.of("chatt_room_id"))
            .build());

        register("cm_chatt_msg", TableConfig.builder()
            .pkColumn("chatt_msg_id")
            .requiredFields(List.of("chatt_room_id", "msg"))
            .fkFields(Map.of("chatt_room_id", "cm_chatt_room"))
            .build());

        register("cm_path", TableConfig.builder()
            .pkColumn("path_id")
            .requiredFields(List.of("path_key", "path_val"))
            .searchFields(List.of("path_key", "path_val", "path_remark"))
            .build());

        // ─── EC - 정산 ────────────────────────────────────────────────
        register("st_settle", TableConfig.builder()
            .pkColumn("settle_id")
            .requiredFields(List.of("vendor_id", "settle_ym"))
            .cdFields(Map.of("settle_status_cd", "SETTLE_STATUS"))
            .fkFields(Map.of("vendor_id", "sy_vendor"))
            .childTables(List.of("st_settle_item", "st_settle_pay", "st_settle_adj"))
            .searchFields(List.of("settle_id", "settle_ym"))
            .build());

        register("st_settle_close", TableConfig.builder()
            .pkColumn("settle_close_id")
            .requiredFields(List.of("settle_ym"))
            .build());

        register("st_settle_config", TableConfig.builder()
            .pkColumn("settle_config_id")
            .requiredFields(List.of("vendor_id"))
            .fkFields(Map.of("vendor_id", "sy_vendor"))
            .build());

        register("st_settle_item", TableConfig.builder()
            .pkColumn("settle_item_id")
            .requiredFields(List.of("settle_id", "order_item_id"))
            .fkFields(Map.of("settle_id", "st_settle"))
            .build());

        register("st_settle_raw", TableConfig.builder()
            .pkColumn("settle_raw_id")
            .requiredFields(List.of("settle_id"))
            .fkFields(Map.of("settle_id", "st_settle"))
            .build());

        register("st_settle_adj", TableConfig.builder()
            .pkColumn("settle_adj_id")
            .requiredFields(List.of("settle_id"))
            .fkFields(Map.of("settle_id", "st_settle"))
            .build());

        register("st_settle_etc_adj", TableConfig.builder()
            .pkColumn("settle_etc_adj_id")
            .requiredFields(List.of("vendor_id"))
            .fkFields(Map.of("vendor_id", "sy_vendor"))
            .build());

        register("st_settle_pay", TableConfig.builder()
            .pkColumn("settle_pay_id")
            .requiredFields(List.of("settle_id"))
            .fkFields(Map.of("settle_id", "st_settle"))
            .build());

        register("st_erp_voucher", TableConfig.builder()
            .pkColumn("erp_voucher_id")
            .requiredFields(List.of("settle_id"))
            .fkFields(Map.of("settle_id", "st_settle"))
            .childTables(List.of("st_erp_voucher_line"))
            .build());

        register("st_erp_voucher_line", TableConfig.builder()
            .pkColumn("erp_voucher_line_id")
            .requiredFields(List.of("erp_voucher_id"))
            .fkFields(Map.of("erp_voucher_id", "st_erp_voucher"))
            .build());

        register("st_recon", TableConfig.builder()
            .pkColumn("recon_id")
            .requiredFields(List.of("settle_id"))
            .fkFields(Map.of("settle_id", "st_settle"))
            .build());
    }

    private void register(String tableName, TableConfig config) {
        registry.put(tableName, config);
    }

    public TableConfig getConfig(String tableName) {
        return registry.getOrDefault(tableName, getDefaultConfig(tableName));
    }

    public boolean isAllowed(String tableName) {
        return ALLOWED_TABLES.contains(tableName);
    }

    public static boolean isSafeIdentifier(String name) {
        return name != null && SAFE_IDENTIFIER.matcher(name).matches();
    }

    private TableConfig getDefaultConfig(String tableName) {
        // Guess PK column: tableName + "_id"  (e.g. "sy_site" -> "site_id")
        String[] parts = tableName.split("_", 2);
        String pk = parts.length > 1 ? parts[1] + "_id" : tableName + "_id";
        return TableConfig.builder()
            .pkColumn(pk)
            .build();
    }
}
