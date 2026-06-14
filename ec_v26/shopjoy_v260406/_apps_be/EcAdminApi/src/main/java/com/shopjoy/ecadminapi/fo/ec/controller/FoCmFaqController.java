package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmFaqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FO FAQ API — 공개 FAQ 목록 조회 (비회원 포함)
 * GET /api/fo/faq/list
 */
@RestController
@RequestMapping("/api/fo/faq")
@RequiredArgsConstructor
public class FoCmFaqController {

    private final FoCmFaqService foCmFaqService;

    /** list — 공개 FAQ 목록 (use_yn='Y') */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<CmFaqDto.Item>>> list(@Valid @ModelAttribute CmFaqDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foCmFaqService.getFaqs(req)));
    }

    /** page — 공개 FAQ 페이지 조회 (페이징/분류 필터). pageList/pageTotalCount/pageTotalPage 반환 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmFaqDto.PageResponse>> page(@Valid @ModelAttribute CmFaqDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foCmFaqService.getFaqsPage(req)));
    }

    /** 조회수 증가 — FAQ 펼침(읽음) 시 호출. 갱신된 viewCount 반환 (세션 중복 방지는 프론트에서 가드) */
    @PostMapping("/{faqId}/view")
    public ResponseEntity<ApiResponse<Integer>> incrView(@PathVariable("faqId") String faqId) {
        return ResponseEntity.ok(ApiResponse.ok(foCmFaqService.incrViewCount(faqId)));
    }
}
