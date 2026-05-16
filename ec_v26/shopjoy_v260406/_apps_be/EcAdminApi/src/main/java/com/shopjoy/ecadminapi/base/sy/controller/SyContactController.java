package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.service.SyContactService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/contact")
@RequiredArgsConstructor
public class SyContactController {

    private final SyContactService service;

    /* 문의 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyContactDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 문의 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyContactDto.Item>>> list(@Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 문의 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyContactDto.PageResponse>> page(@Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 문의 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyContact>> create(@RequestBody SyContact entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 문의 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyContact>> save(@PathVariable("id") String id, @RequestBody SyContact entity) {
        entity.setContactId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 문의 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyContact>> updateSelective(@PathVariable("id") String id, @RequestBody SyContact entity) {
        entity.setContactId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 문의 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 문의 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyContact> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
