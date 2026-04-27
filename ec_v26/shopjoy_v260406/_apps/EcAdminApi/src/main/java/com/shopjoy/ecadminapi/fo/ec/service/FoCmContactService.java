package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

/**
 * FO 문의(Contact) 서비스 — 1:1 문의 / 고객 문의 폼 접수
 * URL: /api/fo/ec/cm/contact
 *
 * 문의 내용을 cm_blog 테이블에 저장 (blogCateId = CONTACT)
 */
@Service
@RequiredArgsConstructor
public class FoCmContactService {

    private static final String CONTACT_CATE = "CONTACT";

    private final CmBlogRepository repository;
    private final CmBlogMapper mapper;

    @Transactional(readOnly = true)
    public CmBlogDto getById(String id) {
        CmBlogDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 문의입니다: " + id);
        return dto;
    }

    @Transactional
    public CmBlog submit(Map<String, Object> body) {
        CmBlog entity = new CmBlog();
        entity.setBlogId(CmUtil.generateId("fo_contact"));
        entity.setBlogCateId(CONTACT_CATE);
        entity.setBlogTitle("[문의] " + body.getOrDefault("inquiryType", "일반"));
        entity.setBlogContent(buildContent(body));
        entity.setUseYn("Y");
        entity.setViewCount(0);

        // Map의 동적 필드 자동 복사 (siteId, blogAuthor 등)
        // regBy, regDate, updBy, updDate는 제외하고 나머지는 자동 복사
        VoUtil.mapCopy(body, entity, "blogId", "blogCateId", "blogTitle", "blogContent", "useYn", "viewCount", "regBy", "regDate", "updBy", "updDate");

        String authId = SecurityUtil.getAuthIdOrGuest();
        entity.setRegBy(authId);
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(authId);
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = repository.save(entity);
        if (saved == null) throw new CmBizException("문의 접수에 실패했습니다.");
        return saved;
    }

    private String buildContent(Map<String, Object> body) {
        return String.format(
            "이름: %s\n이메일: %s\n연락처: %s\n주문번호: %s\n문의유형: %s\n\n%s",
            body.getOrDefault("name",        ""),
            body.getOrDefault("email",       ""),
            body.getOrDefault("tel",         ""),
            body.getOrDefault("orderNo",     ""),
            body.getOrDefault("inquiryType", ""),
            body.getOrDefault("desc",        "")
        );
    }

}
