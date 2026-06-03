package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.service.SyContactService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyContact>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyContact entity) {
        SyContact result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyContact> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
