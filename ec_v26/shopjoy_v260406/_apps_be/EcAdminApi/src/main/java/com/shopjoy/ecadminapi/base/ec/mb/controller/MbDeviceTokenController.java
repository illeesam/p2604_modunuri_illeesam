package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbDeviceTokenService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/device-token")
@RequiredArgsConstructor
public class MbDeviceTokenController {

    private final MbDeviceTokenService service;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceTokenDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbDeviceTokenDto.Item>>> list(@Valid @ModelAttribute MbDeviceTokenDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbDeviceTokenDto.PageResponse>> page(@Valid @ModelAttribute MbDeviceTokenDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbDeviceToken>> create(@RequestBody MbDeviceToken entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceToken>> save(@PathVariable("id") String id, @RequestBody MbDeviceToken entity) {
        entity.setDeviceTokenId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceToken>> updateSelective(@PathVariable("id") String id, @RequestBody MbDeviceToken entity) {
        entity.setDeviceTokenId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<MbDeviceToken>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody MbDeviceToken entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<MbDeviceToken> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
