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
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<MbMemberAddr>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody MbMemberAddr entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<MbMemberAddr> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
