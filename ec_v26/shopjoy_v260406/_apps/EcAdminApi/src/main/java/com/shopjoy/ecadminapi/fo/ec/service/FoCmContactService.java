package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnRepository;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * FO 문의(Contact) 서비스 — 1:1 문의 / 고객 문의 폼 접수
 * URL: /api/fo/ec/cm/contact
 *
 * 문의 내용을 cm_bltn 테이블에 저장 (blogCateId = CONTACT)
 */
@Service
@RequiredArgsConstructor
public class FoCmContactService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private static final String CONTACT_CATE = "CONTACT";

    private final CmBltnRepository repository;

    @Transactional
    public CmBltn submit(Map<String, Object> body) {
        CmBltn entity = new CmBltn();
        entity.setBlogId(generateId());
        entity.setSiteId((String) body.get("siteId"));
        entity.setBlogCateId(CONTACT_CATE);
        entity.setBlogTitle("[문의] " + body.getOrDefault("inquiryType", "일반"));
        entity.setBlogContent(buildContent(body));
        entity.setBlogAuthor((String) body.getOrDefault("name", ""));
        entity.setUseYn("Y");
        entity.setViewCount(0);
        String userId = SecurityUtil.isLogin() ? SecurityUtil.currentUserId() : "GUEST";
        entity.setRegBy(userId);
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
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

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "CT" + ts + rand;
    }
}
