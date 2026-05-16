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

    private final CmBlogRepository cmBlogRepository;
    private final CmBlogReplyService cmBlogReplyService;

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
        entity.setSiteId(req.getSiteId());
        entity.setBlogAuthor(req.getBlogAuthor());
        entity.setUseYn("Y");
        entity.setViewCount(0);

        String authId = SecurityUtil.getAuthIdOrGuest();
        entity.setRegBy(authId);
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(authId);
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("문의 접수에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
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
