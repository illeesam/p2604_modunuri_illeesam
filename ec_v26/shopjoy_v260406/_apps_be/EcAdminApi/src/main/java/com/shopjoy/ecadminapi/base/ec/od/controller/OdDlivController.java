package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/dliv")
@RequiredArgsConstructor
public class OdDlivController {

    private final OdDlivService service;

    /* 배송 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배송 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivDto.Item>>> list(@Valid @ModelAttribute OdDlivDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배송 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdDlivDto.PageResponse>> page(@Valid @ModelAttribute OdDlivDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배송 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdDliv>> create(@RequestBody OdDliv entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배송 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> save(@PathVariable("id") String id, @RequestBody OdDliv entity) {
        entity.setDlivId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 배송 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> updateSelective(@PathVariable("id") String id, @RequestBody OdDliv entity) {
        entity.setDlivId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 배송 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdDliv>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdDliv entity) {
        OdDliv result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdDliv> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
