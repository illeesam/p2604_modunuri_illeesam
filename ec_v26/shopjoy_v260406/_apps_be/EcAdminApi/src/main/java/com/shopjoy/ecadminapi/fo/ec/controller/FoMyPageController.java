package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberChangePasswordDto;
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
public class FoMyPageController {

    private final FoMyPageService foMyPageService;

    /** getMyInfo — 조회 */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<MbMemberDto.Item>> getMyInfo() {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyInfo()));
    }

    /** updateMyInfo — 수정 */
    @PutMapping("/info")
    public ResponseEntity<ApiResponse<MbMemberDto.Item>> updateMyInfo(@RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.updateMyInfo(body)));
    }

    /** changePassword */
    @PostMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody MbMemberChangePasswordDto.Request req) {
        foMyPageService.changePassword(req.getCurrentPassword(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok(null, "비밀번호가 변경되었습니다."));
    }

    /** getMyAddrs — 조회 */
    @GetMapping("/addr")
    public ResponseEntity<ApiResponse<List<MbMemberAddrDto.Item>>> getMyAddrs() {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyAddrs()));
    }

    /** saveAddr — 저장 */
    @PostMapping("/addr")
    public ResponseEntity<ApiResponse<MbMemberAddr>> saveAddr(@RequestBody MbMemberAddr body) {
        MbMemberAddr result = foMyPageService.saveAddr(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** deleteAddr — 삭제 */
    @DeleteMapping("/addr/{addrId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddr(@PathVariable("addrId") String addrId) {
        foMyPageService.deleteAddr(addrId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** getMyOrders — 조회 */
    @GetMapping("/order")
    public ResponseEntity<ApiResponse<List<OdOrderDto.Item>>> getMyOrders(@jakarta.validation.Valid @ModelAttribute OdOrderDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyOrders(req)));
    }

    /** getMyClaims — 조회 */
    @GetMapping("/claim")
    public ResponseEntity<ApiResponse<List<OdClaimDto.Item>>> getMyClaims(@jakarta.validation.Valid @ModelAttribute OdClaimDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyClaims(req)));
    }

    /** getMyCoupons — 조회 */
    @GetMapping("/coupon")
    public ResponseEntity<ApiResponse<List<PmCouponDto.Item>>> getMyCoupons(@jakarta.validation.Valid @ModelAttribute PmCouponDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyCoupons(req)));
    }

    /** getMyCacheHistory — 조회 */
    @GetMapping("/cache")
    public ResponseEntity<ApiResponse<List<PmCacheDto.Item>>> getMyCacheHistory(@jakarta.validation.Valid @ModelAttribute PmCacheDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(foMyPageService.getMyCacheHistory(req)));
    }
}
