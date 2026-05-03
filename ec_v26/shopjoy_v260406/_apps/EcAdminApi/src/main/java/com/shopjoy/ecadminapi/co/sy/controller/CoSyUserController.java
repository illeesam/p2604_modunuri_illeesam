package com.shopjoy.ecadminapi.co.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 사용자 공용 API — /api/co/sy/user
 * 인가: permitAll (로그인 전 사용자 선택 모달에서 사용)
 * 반환 필드: loginId, userNm, roleId, userStatusCd (loginPwdHash 제외)
 */
@RestController
@RequestMapping("/api/co/sy/user")
@RequiredArgsConstructor
public class CoSyUserController {

    private final BoSyUserService service;

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyUserDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }
}
