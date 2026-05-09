package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmContactSubmitDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * FO 고객 문의(Contact) API — 비회원/회원 모두 사용 가능
 * POST /api/fo/ec/cm/contact — 문의 접수
 *
 * 인가: 전역 룰에서 POST /api/** 는 USER or MEMBER 이지만,
 *       문의는 비회원도 가능하도록 SecurityConfig에서 별도 허용 필요 (또는 permitAll 추가)
 */
@RestController
@RequestMapping("/api/fo/ec/cm/contact")
@RequiredArgsConstructor
public class FoCmContactController {

    private final FoCmContactService foCmContactService;

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(foCmContactService.getById(id)));
    }

    /** submit — 제출 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlog>> submit(@RequestBody CmContactSubmitDto.Request req) {
        CmBlog result = foCmContactService.submit(req);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}
