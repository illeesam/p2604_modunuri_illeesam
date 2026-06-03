package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhDlivChgHistService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/dliv-chg-hist")
@RequiredArgsConstructor
public class OdhDlivChgHistController {

    private final OdhDlivChgHistService service;

    /* 배송 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배송 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhDlivChgHistDto.Item>>> list(@Valid @ModelAttribute OdhDlivChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배송 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhDlivChgHistDto.PageResponse>> page(@Valid @ModelAttribute OdhDlivChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배송 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhDlivChgHist>> create(@RequestBody OdhDlivChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배송 변경 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivChgHist>> save(@PathVariable("id") String id, @RequestBody OdhDlivChgHist entity) {
        entity.setDlivChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 배송 변경 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivChgHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhDlivChgHist entity) {
        entity.setDlivChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 배송 변경 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdhDlivChgHist>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdhDlivChgHist entity) {
        OdhDlivChgHist result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdhDlivChgHist> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
