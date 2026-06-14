package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmContactSubmitDto;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogReplyService;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * FO 문의(Contact) 서비스 — 1:1 문의 / 고객 문의 폼 접수
 * URL: /api/fo/inquiry/create
 *
 * 문의 내용을 sy_contact 테이블에 저장한다(마이페이지 문의 조회 = sy_contact 와 정본 일치).
 * (이전에는 cm_blog 에 저장해 마이페이지 조회(sy_contact)와 어긋났음 — 2026-06-13 통일)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoCmContactService {

    /** 신규 문의 초기 상태 — CONTACT_STATUS_KR 코드값(요청/처리중/답변완료/취소됨) 기준 */
    private static final String CONTACT_STATUS_NEW = "요청";
    /** site_id 는 NOT NULL — 요청/인증에 siteId 없을 때(비회원 문의) 대표 사이트로 fallback */
    private static final String DEFAULT_SITE_ID = "2604010000000001";

    private final CmBlogRepository cmBlogRepository;
    private final CmBlogReplyService cmBlogReplyService;
    private final SyContactRepository syContactRepository;
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

    /** submit — 제출 (sy_contact 에 저장). 마이페이지 문의 조회(sy_contact)와 정본 일치. */
    @Transactional
    public SyContact submit(CmContactSubmitDto.Request req) {
        if (req == null) throw new CmBizException("요청 데이터가 비어있습니다." + "::" + CmUtil.svcCallerInfo(this));

        SyContact entity = new SyContact();
        entity.setContactId(CmUtil.generateId("fo_contact"));
        entity.setSiteId(_resolveSiteId(req));
        // 로그인 회원이면 memberId 세팅 → 마이페이지(memberId 필터) 조회에 노출. 비회원이면 null.
        // ⚠️ FO 회원 식별자는 authId (= ec_member.member_id). userId() 는 BO 전용이라 FO 에선 "" 가 되어
        //    마이페이지 조회(memberId=authId 필터)와 어긋남 — 반드시 authId() 사용.
        if (SecurityUtil.isLogin()) entity.setMemberId(SecurityUtil.getAuthUser().authId());
        entity.setMemberNm(req.getName());
        entity.setCategoryCd(req.getInquiryType());
        entity.setContactTitle("[문의] " + (req.getInquiryType() != null ? req.getInquiryType() : "일반"));
        entity.setContactContent(buildContent(req));
        entity.setContentAttachGrpId(req.getContentAttachGrpId());
        entity.setContactStatusCd(CONTACT_STATUS_NEW);
        entity.setContactDate(LocalDateTime.now());

        String authId = SecurityUtil.getAuthIdOrGuest();
        entity.setRegBy(authId);
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(authId);
        entity.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(entity);
        if (saved == null) throw new CmBizException("문의 접수에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));

        // 접수 완료 알림 발송 (메일/카카오/시스템알림) — 비동기(fire-and-forget).
        // 메일 SMTP 발송이 응답을 지연시키지 않도록 별도 스레드풀에서 처리. 발송 결과는 이력 테이블에만 기록.
        cmMsgSendService.sendContactReceivedAsync(
            saved.getSiteId(), saved.getContactId(),
            req.getName(), req.getEmail(), req.getTel(), req.getInquiryType());
        return saved;
    }

    /** _resolveSiteId — siteId 결정: 요청값 → 인증 사용자 → 대표 사이트(비회원 문의 fallback) */
    private String _resolveSiteId(CmContactSubmitDto.Request req) {
        if (req.getSiteId() != null && !req.getSiteId().isBlank()) return req.getSiteId();
        return SecurityUtil.getSiteIdOrDefault(DEFAULT_SITE_ID);
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
