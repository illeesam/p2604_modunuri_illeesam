package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimItemChgHistService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/claim-item-chg-hist")
@RequiredArgsConstructor
public class OdhClaimItemChgHistController {

    private final OdhClaimItemChgHistService service;

    /* 클레임 아이템 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 클레임 아이템 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimItemChgHistDto.Item>>> list(@Valid @ModelAttribute OdhClaimItemChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 클레임 아이템 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhClaimItemChgHistDto.PageResponse>> page(@Valid @ModelAttribute OdhClaimItemChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 클레임 아이템 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhClaimItemChgHist>> create(@RequestBody OdhClaimItemChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 클레임 아이템 변경 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemChgHist>> save(@PathVariable("id") String id, @RequestBody OdhClaimItemChgHist entity) {
        entity.setClaimItemChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 클레임 아이템 변경 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemChgHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhClaimItemChgHist entity) {
        entity.setClaimItemChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 클레임 아이템 변경 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdhClaimItemChgHist>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdhClaimItemChgHist entity) {
        OdhClaimItemChgHist result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdhClaimItemChgHist> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
