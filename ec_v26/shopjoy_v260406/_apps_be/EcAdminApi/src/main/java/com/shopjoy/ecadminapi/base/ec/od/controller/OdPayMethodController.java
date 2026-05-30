package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.service.OdPayMethodService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/pay-method")
@RequiredArgsConstructor
public class OdPayMethodController {

    private final OdPayMethodService service;

    /* 결제수단 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayMethodDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 결제수단 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdPayMethodDto.Item>>> list(@Valid @ModelAttribute OdPayMethodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 결제수단 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdPayMethodDto.PageResponse>> page(@Valid @ModelAttribute OdPayMethodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 결제수단 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdPayMethod>> create(@RequestBody OdPayMethod entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 결제수단 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayMethod>> save(@PathVariable("id") String id, @RequestBody OdPayMethod entity) {
        entity.setPayMethodId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 결제수단 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayMethod>> updateSelective(@PathVariable("id") String id, @RequestBody OdPayMethod entity) {
        entity.setPayMethodId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 결제수단 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<OdPayMethod>> saveDefault(@RequestBody OdPayMethod entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdPayMethod>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdPayMethod entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdPayMethod> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdPayMethod> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
