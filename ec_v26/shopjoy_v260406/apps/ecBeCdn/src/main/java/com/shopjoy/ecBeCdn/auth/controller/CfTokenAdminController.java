package com.shopjoy.ecBeCdn.auth.controller;

import com.shopjoy.ecBeCdn.auth.dto.CfTokenDto;
import com.shopjoy.ecBeCdn.auth.dto.CfTokenHistDto;
import com.shopjoy.ecBeCdn.auth.entity.CfToken;
import com.shopjoy.ecBeCdn.auth.entity.CfTokenHist;
import com.shopjoy.ecBeCdn.auth.repository.CfTokenHistRepository;
import com.shopjoy.ecBeCdn.auth.repository.CfTokenRepository;
import com.shopjoy.ecBeCdn.auth.service.CfAuthService;
import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import com.shopjoy.ecBeCdn.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

/** 인증 테스트 화면(static/js/pages/CfAuthTest.js) 전용 — 발급된 토큰 목록/이력 조회 + 강제 폐기. */
@RestController
@RequestMapping("/api/cdn/auth")
@RequiredArgsConstructor
public class CfTokenAdminController {

    private final CfTokenRepository cfTokenRepository;
    private final CfTokenHistRepository cfTokenHistRepository;
    private final CfAuthService cfAuthService;

    @GetMapping("/token/page")
    public ApiResponse<PageResult<CfTokenDto>> tokenPage(
            @RequestParam(required = false) String clientId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(0, pageNo - 1), pageSize, Sort.by(Sort.Direction.DESC, "regDate"));
        Page<CfToken> page = cfTokenRepository.findByClientIdContaining(clientId == null ? "" : clientId, pageable);
        PageResult<CfTokenDto> result = new PageResult<>(
            page.getContent().stream().map(CfTokenDto::from).toList(), page.getTotalElements(), pageNo, pageSize);
        return ApiResponse.ok(result);
    }

    @GetMapping("/token-hist/page")
    public ApiResponse<PageResult<CfTokenHistDto>> tokenHistPage(
            @RequestParam(required = false) String clientId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(0, pageNo - 1), pageSize, Sort.by(Sort.Direction.DESC, "regDate"));
        Page<CfTokenHist> page = cfTokenHistRepository.findByClientIdContaining(clientId == null ? "" : clientId, pageable);
        PageResult<CfTokenHistDto> result = new PageResult<>(
            page.getContent().stream().map(CfTokenHistDto::from).toList(), page.getTotalElements(), pageNo, pageSize);
        return ApiResponse.ok(result);
    }

    /** 강제 폐기(요청사항) — 이 토큰(refreshToken)으로는 더 이상 재발급이 안 된다. */
    @DeleteMapping("/token/{tokenId}")
    public ApiResponse<Void> revoke(@PathVariable String tokenId,
                                     @RequestParam(required = false) String reason) {
        cfAuthService.revoke(tokenId, reason);
        return ApiResponse.ok(null, "폐기되었습니다.");
    }
}
