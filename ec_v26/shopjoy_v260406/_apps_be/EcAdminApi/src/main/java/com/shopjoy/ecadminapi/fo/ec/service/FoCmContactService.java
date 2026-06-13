package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmContactSubmitDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogReplyService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * FO 문의(Contact) 서비스 — 1:1 문의 / 고객 문의 폼 접수
 * URL: /api/fo/ec/cm/contact
 *
 * 문의 내용을 cm_blog 테이블에 저장 (blogCateId = CONTACT)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoCmContactService {

    private static final String CONTACT_CATE = "CONTACT";
    /** site_id 는 NOT NULL — 요청/인증에 siteId 없을 때(비회원 문의) 대표 사이트로 fallback */
    private static final String DEFAULT_SITE_ID = "SITE000001";

    private final CmBlogRepository cmBlogRepository;
    private final CmBlogReplyService cmBlogReplyService;
    private final com.shopjoy.ecadminapi.co.cm.service.CmMsgSendService cmMsgSendService;

    /** getById — 조회 */
    public CmBlogDto.Item getById(String id) {
        CmBlogDto.Item dto = cmBlogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 문의입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** _itemFillRelations — 단건 연관조회 (replies 채우기) */
    private void _itemFillRelations(CmBlogDto.Item contact) {
        if (contact == null) return;

        // 하위 답변(댓글) 목록 조회 (blogId 기준)
        CmBlogReplyDto.Request rReq = new CmBlogReplyDto.Request();
        rReq.setBlogId(contact.getBlogId());
        contact.setReplies(cmBlogReplyService.getList(rReq)); // 답변목록
    }

    /** submit — 제출 */
    @Transactional
    public CmBlog submit(CmContactSubmitDto.Request req) {
        if (req == null) throw new CmBizException("요청 데이터가 비어있습니다." + "::" + CmUtil.svcCallerInfo(this));
        CmBlog entity = new CmBlog();
        entity.setBlogId(CmUtil.generateId("fo_contact"));
        entity.setBlogCateId(CONTACT_CATE);
        entity.setBlogTitle("[문의] " + (req.getInquiryType() != null ? req.getInquiryType() : "일반"));
        entity.setBlogContent(buildContent(req));
        entity.setSiteId(_resolveSiteId(req));
        entity.setBlogAuthor(req.getBlogAuthor());
        entity.setContentAttachGrpId(req.getContentAttachGrpId());
        entity.setUseYn("Y");
        entity.setViewCount(0);

        String authId = SecurityUtil.getAuthIdOrGuest();
        entity.setRegBy(authId);
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(authId);
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("문의 접수에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));

        // 접수 완료 알림 발송 (메일/카카오/시스템알림) — 비동기(fire-and-forget).
        // 메일 SMTP 발송이 응답을 지연시키지 않도록 별도 스레드풀에서 처리. 발송 결과는 이력 테이블에만 기록.
        cmMsgSendService.sendContactReceivedAsync(
            saved.getSiteId(), saved.getBlogId(),
            req.getName(), req.getEmail(), req.getTel(), req.getInquiryType());
        return saved;
    }

    /** _resolveSiteId — siteId 결정: 요청값 → 인증 사용자 → 대표 사이트(비회원 문의 fallback) */
    private String _resolveSiteId(CmContactSubmitDto.Request req) {
        if (req.getSiteId() != null && !req.getSiteId().isBlank()) return req.getSiteId();
        String authSiteId = SecurityUtil.getSiteId();
        if (authSiteId != null && !authSiteId.isBlank()) return authSiteId;
        return DEFAULT_SITE_ID;
    }

    /** buildContent — 구성 */
    private String buildContent(CmContactSubmitDto.Request req) {
        return String.format(
            "이름: %s\n이메일: %s\n연락처: %s\n주문번호: %s\n문의유형: %s\n\n%s",
            req.getName()        != null ? req.getName()        : "",
            req.getEmail()       != null ? req.getEmail()       : "",
            req.getTel()         != null ? req.getTel()         : "",
            req.getOrderNo()     != null ? req.getOrderNo()     : "",
            req.getInquiryType() != null ? req.getInquiryType() : "",
            req.getMessage()     != null ? req.getMessage()     : ""
        );
    }

}
