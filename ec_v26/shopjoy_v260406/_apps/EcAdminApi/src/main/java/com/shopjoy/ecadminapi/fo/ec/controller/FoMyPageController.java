package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.auth.annotation.MemberOnly;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoMyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 마이페이지 API — 현재 로그인 회원 전용
 * GET  /api/fo/ec/my/info              — 내 정보
 * PUT  /api/fo/ec/my/info              — 내 정보 수정
 * POST /api/fo/ec/my/password          — 비밀번호 변경
 * GET  /api/fo/ec/my/addr              — 내 배송지 목록
 * POST /api/fo/ec/my/addr              — 배송지 추가
 * DELETE /api/fo/ec/my/addr/{addrId}   — 배송지 삭제
 * GET  /api/fo/ec/my/order             — 내 주문 목록
 * GET  /api/fo/ec/my/claim             — 내 클레임 목록
 * GET  /api/fo/ec/my/coupon            — 내 쿠폰 목록
 * GET  /api/fo/ec/my/cache             — 내 캐시 내역
 *
 * 인가: 전체 MEMBER or USER
 */
@RestController
@RequestMapping("/api/fo/ec/my")
@RequiredArgsConstructor
@MemberOnly
public class FoMyPageController {

    private final FoMyPageService service;

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<MbMemberDto>> getMyInfo() {
        MbMemberDto result = service.getMyInfo();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/info")
    public ResponseEntity<ApiResponse<MbMemberDto>> updateMyInfo(@RequestBody MbMember body) {
        MbMemberDto result = service.updateMyInfo(body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody Map<String, String> body) {
        service.changePassword(body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.ok(null, "비밀번호가 변경되었습니다."));
    }

    @GetMapping("/addr")
    public ResponseEntity<ApiResponse<List<MbMemberAddrDto>>> getMyAddrs() {
        List<MbMemberAddrDto> result = service.getMyAddrs();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/addr")
    public ResponseEntity<ApiResponse<MbMemberAddr>> saveAddr(@RequestBody MbMemberAddr body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.saveAddr(body)));
    }

    @DeleteMapping("/addr/{addrId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddr(@PathVariable String addrId) {
        service.deleteAddr(addrId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @GetMapping("/order")
    public ResponseEntity<ApiResponse<List<OdOrderDto>>> getMyOrders(
            @RequestParam(required = false) String siteId) {
        List<OdOrderDto> result = service.getMyOrders(siteId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/claim")
    public ResponseEntity<ApiResponse<List<OdClaimDto>>> getMyClaims(
            @RequestParam(required = false) String siteId) {
        List<OdClaimDto> result = service.getMyClaims(siteId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/coupon")
    public ResponseEntity<ApiResponse<List<PmCouponDto>>> getMyCoupons() {
        List<PmCouponDto> result = service.getMyCoupons();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/cache")
    public ResponseEntity<ApiResponse<List<PmCacheDto>>> getMyCacheHistory() {
        List<PmCacheDto> result = service.getMyCacheHistory();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
