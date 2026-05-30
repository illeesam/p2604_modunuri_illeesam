package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.service.SyVocService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/voc")
@RequiredArgsConstructor
public class SyVocController {

    private final SyVocService service;

    /* 고객의 소리(VOC) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVocDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 고객의 소리(VOC) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVocDto.Item>>> list(@Valid @ModelAttribute SyVocDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 고객의 소리(VOC) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyVocDto.PageResponse>> page(@Valid @ModelAttribute SyVocDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 고객의 소리(VOC) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVoc>> create(@RequestBody SyVoc entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 고객의 소리(VOC) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVoc>> save(@PathVariable("id") String id, @RequestBody SyVoc entity) {
        entity.setVocId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 고객의 소리(VOC) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVoc>> updateSelective(@PathVariable("id") String id, @RequestBody SyVoc entity) {
        entity.setVocId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 고객의 소리(VOC) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyVoc>> saveDefault(@RequestBody SyVoc entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyVoc>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyVoc entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVoc> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyVoc> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
