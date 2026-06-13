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
}
