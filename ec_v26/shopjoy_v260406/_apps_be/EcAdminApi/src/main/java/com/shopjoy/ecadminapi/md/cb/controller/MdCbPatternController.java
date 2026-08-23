package com.shopjoy.ecadminapi.md.cb.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbPatternCellDto;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbPatternDto;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbPatternYarnDto;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPattern;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternCell;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternYarn;
import com.shopjoy.ecadminapi.md.cb.service.MdCbPatternCellService;
import com.shopjoy.ecadminapi.md.cb.service.MdCbPatternService;
import com.shopjoy.ecadminapi.md.cb.service.MdCbPatternYarnService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 코바늘 도안 API — /api/cb/pattern
 * FO(회원 도안 편집기) / BO(관리자 도안 관리) 공용. 권한 구분 없이 전체 도안을 조회/편집 가능
 * (2026-08-23: 회원 소유권 제한을 두지 않기로 단순화 확정).
 */
@RestController
@RequestMapping("/api/md/cb/pattern")
@RequiredArgsConstructor
public class MdCbPatternController {

    private final MdCbPatternService mdCbPatternService;
    private final MdCbPatternCellService mdCbPatternCellService;
    private final MdCbPatternYarnService mdCbPatternYarnService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MdCbPatternDto.Item>>> list(@Valid @ModelAttribute MdCbPatternDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbPatternService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<MdCbPatternDto.Item>>> page(@Valid @ModelAttribute MdCbPatternDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbPatternService.getPageData(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MdCbPatternDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbPatternService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MdCbPattern>> create(@Valid @RequestBody MdCbPattern body) {
        return ResponseEntity.status(201).body(ApiResponse.created(mdCbPatternService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MdCbPattern>> update(@PathVariable("id") String id, @Valid @RequestBody MdCbPattern body) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbPatternService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        mdCbPatternService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** getCells — 도안 격자 셀 조회 */
    @GetMapping("/{id}/cells")
    public ResponseEntity<ApiResponse<List<MdCbPatternCellDto.Item>>> getCells(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbPatternCellService.getByPatternId(id)));
    }

    /** saveCells — 도안 격자 셀 전체 교체 저장 */
    @PostMapping("/{id}/cells")
    public ResponseEntity<ApiResponse<Void>> saveCells(@PathVariable("id") String id, @RequestBody List<MdCbPatternCell> rows) {
        mdCbPatternCellService.replaceAll(id, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** getYarns — 도안-실 매핑(재료 목록) 조회 */
    @GetMapping("/{id}/yarns")
    public ResponseEntity<ApiResponse<List<MdCbPatternYarnDto.Item>>> getYarns(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbPatternYarnService.getByPatternId(id)));
    }

    /** saveYarns — 도안-실 매핑(재료 목록) 전체 교체 저장 */
    @PostMapping("/{id}/yarns")
    public ResponseEntity<ApiResponse<Void>> saveYarns(@PathVariable("id") String id, @RequestBody List<MdCbPatternYarn> rows) {
        mdCbPatternYarnService.replaceAll(id, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
