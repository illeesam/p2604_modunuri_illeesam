package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberSnsService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-sns")
@RequiredArgsConstructor
public class MbMemberSnsController {

    private final MbMemberSnsService service;

    /* SNS 연동 회원 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberSnsDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* SNS 연동 회원 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberSnsDto.Item>>> list(@Valid @ModelAttribute MbMemberSnsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* SNS 연동 회원 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberSnsDto.PageResponse>> page(@Valid @ModelAttribute MbMemberSnsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* SNS 연동 회원 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberSns>> create(@RequestBody MbMemberSns entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* SNS 연동 회원 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberSns>> save(@PathVariable("id") String id, @RequestBody MbMemberSns entity) {
        entity.setMemberSnsId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* SNS 연동 회원 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberSns>> updateSelective(@PathVariable("id") String id, @RequestBody MbMemberSns entity) {
        entity.setMemberSnsId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* SNS 연동 회원 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* SNS 연동 회원 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberSns> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
