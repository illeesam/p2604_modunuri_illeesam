package com.shopjoy.ecBeCdn.auth.controller;

import com.shopjoy.ecBeCdn.auth.dto.CfClientCreateReq;
import com.shopjoy.ecBeCdn.auth.dto.CfClientDto;
import com.shopjoy.ecBeCdn.auth.dto.CfClientUpdateReq;
import com.shopjoy.ecBeCdn.auth.service.CfClientService;
import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import com.shopjoy.ecBeCdn.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** cf_client 관리 CRUD API — permitAll(로그인 불필요, 2026-09-06 — 관리 화면 요청사항). */
@RestController
@RequestMapping("/api/cdn/client")
@RequiredArgsConstructor
public class CfClientAdminController {

    private final CfClientService cfClientService;

    @GetMapping("/page")
    public ApiResponse<PageResult<CfClientDto>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(cfClientService.getPage(keyword, pageNo, pageSize));
    }

    @GetMapping("/{clientId}")
    public ApiResponse<CfClientDto> get(@PathVariable String clientId) {
        return ApiResponse.ok(cfClientService.getById(clientId));
    }

    @PostMapping
    public ApiResponse<CfClientDto> create(@Valid @RequestBody CfClientCreateReq req) {
        return ApiResponse.created(cfClientService.create(req));
    }

    @PutMapping("/{clientId}")
    public ApiResponse<CfClientDto> update(@PathVariable String clientId, @RequestBody CfClientUpdateReq req) {
        return ApiResponse.ok(cfClientService.update(clientId, req));
    }

    @DeleteMapping("/{clientId}")
    public ApiResponse<Void> delete(@PathVariable String clientId) {
        cfClientService.delete(clientId);
        return ApiResponse.ok(null, "삭제되었습니다.");
    }
}
