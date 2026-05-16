package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberAddrService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-addr")
@RequiredArgsConstructor
public class MbMemberAddrController {

    private final MbMemberAddrService service;

    /* 회원 주소 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberAddrDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 회원 주소 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberAddrDto.Item>>> list(@Valid @ModelAttribute MbMemberAddrDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 회원 주소 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberAddrDto.PageResponse>> page(@Valid @ModelAttribute MbMemberAddrDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 회원 주소 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberAddr>> create(@RequestBody MbMemberAddr entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 회원 주소 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberAddr>> save(@PathVariable("id") String id, @RequestBody MbMemberAddr entity) {
        entity.setMemberAddrId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 회원 주소 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberAddr>> updateSelective(@PathVariable("id") String id, @RequestBody MbMemberAddr entity) {
        entity.setMemberAddrId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 회원 주소 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 회원 주소 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberAddr> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
