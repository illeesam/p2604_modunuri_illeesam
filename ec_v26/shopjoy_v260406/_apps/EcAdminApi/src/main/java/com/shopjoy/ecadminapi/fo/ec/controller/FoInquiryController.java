package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * FO 고객 문의(Inquiry) API (프론트엔드 경로 호환)
 * POST /api/fo/inquiry/create — 문의 생성
 *
 * 인가: 회원/비회원 모두 허용
 */
@RestController
@RequestMapping("/api/fo/inquiry")
@RequiredArgsConstructor
public class FoInquiryController {

    private final FoCmContactService foCmContactService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createInquiry(@RequestBody Map<String, Object> body) {
        CmBlog result = foCmContactService.submit(body);
        Map<String, Object> response = new HashMap<>();
        response.put("data", result);
        return ResponseEntity.status(201).body(ApiResponse.created(response));
    }
}
