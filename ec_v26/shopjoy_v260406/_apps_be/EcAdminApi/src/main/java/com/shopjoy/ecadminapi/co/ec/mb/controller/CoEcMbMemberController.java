package com.shopjoy.ecadminapi.co.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 회원 공용 API — /api/co/ec/mb/member
 * 인가: permitAll (로그인 전 회원 선택 모달에서 사용)
 * 반환 필드: memberId, memberNm, loginId, memberEmail (loginPwdHash 제외)
 */
@RestController
@RequestMapping("/api/co/ec/mb/member")
@RequiredArgsConstructor
public class CoEcMbMemberController {

    private final BoMbMemberService boMbMemberService;

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberDto.PageResponse>> page(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getPageData(req)));
    }
}
