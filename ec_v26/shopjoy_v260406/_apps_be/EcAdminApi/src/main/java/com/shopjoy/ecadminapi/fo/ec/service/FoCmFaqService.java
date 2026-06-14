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
        SecurityUtil.applySiteId(req::getSiteId, req::setSiteId, DEFAULT_SITE_ID);
        req.setUseYn("Y");   // 공개(노출중)만
        return cmFaqService.getList(req);
    }

    /** getFaqsPage — 공개 FAQ 페이지 조회 (노출중·사이트별, pathId 자손 포함). 페이징 버튼 클릭마다 호출 */
    public CmFaqDto.PageResponse getFaqsPage(CmFaqDto.Request req) {
        if (req == null) req = new CmFaqDto.Request();
        SecurityUtil.applySiteId(req::getSiteId, req::setSiteId, DEFAULT_SITE_ID);
        req.setUseYn("Y");   // 공개(노출중)만
        return cmFaqService.getPageData(req);
    }

    /** incrViewCount — FAQ 펼침(읽음) 시 조회수 +1, 갱신된 viewCount 반환 */
    @Transactional
    public Integer incrViewCount(String faqId) {
        return cmFaqService.incrViewCount(faqId);
    }
}
