package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/gift")
@RequiredArgsConstructor
public class PmGiftController {

    private final PmGiftService service;

    /* 사은품 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 사은품 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmGiftDto.Item>>> list(@Valid @ModelAttribute PmGiftDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 사은품 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmGiftDto.PageResponse>> page(@Valid @ModelAttribute PmGiftDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 사은품 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmGift>> create(@RequestBody PmGift entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 사은품 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGift>> save(@PathVariable("id") String id, @RequestBody PmGift entity) {
        entity.setGiftId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 사은품 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGift>> updateSelective(@PathVariable("id") String id, @RequestBody PmGift entity) {
        entity.setGiftId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 사은품 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmGift>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmGift entity) {
        PmGift result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmGift> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
