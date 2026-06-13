package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmFaqService;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * FO FAQ 서비스 — 공개 FAQ 목록 조회 (use_yn='Y' 강제).
 * URL: /api/fo/faq
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoCmFaqService {

    private static final String DEFAULT_SITE_ID = "2604010000000001";

    private final CmFaqService cmFaqService;

    /** getFaqs — 공개 FAQ 목록 (노출중인 것만, 사이트별) */
    public List<CmFaqDto.Item> getFaqs(CmFaqDto.Request req) {
        if (req == null) req = new CmFaqDto.Request();
        // siteId: 요청값 → 인증 사용자 siteId → 대표 사이트(비회원 공개)
        if (req.getSiteId() == null || req.getSiteId().isBlank()) {
            String authSiteId = SecurityUtil.getSiteId();
            req.setSiteId((authSiteId != null && !authSiteId.isBlank()) ? authSiteId : DEFAULT_SITE_ID);
        }
        req.setUseYn("Y");   // 공개(노출중)만
        return cmFaqService.getList(req);
    }
}
