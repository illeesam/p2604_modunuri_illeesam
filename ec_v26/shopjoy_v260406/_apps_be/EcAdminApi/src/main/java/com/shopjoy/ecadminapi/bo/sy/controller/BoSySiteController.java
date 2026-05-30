package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.bo.sy.service.BoSySiteService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 사이트 API — /api/bo/sy/site
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/site")
@RequiredArgsConstructor
public class BoSySiteController {
    private final BoSySiteService boSySiteService;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SySiteDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getById(id)));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SySiteDto.Item>>> list(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SySiteDto.PageResponse>> page(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getPageData(req)));
    }

    /** pathCounts — 표시경로 노드별 사이트수 (검색조건 + 자손 누적, 트리 우측 뱃지용)
     *   응답: { pathId: 사이트수, '__total__': 전체합계, '__orphan__': path 없음 }.
     *   검색조건(searchValue / status / typeCd / dateStart / dateEnd) 이 있으면 그 조건에 부합하는 사이트만 카운트. */
    @GetMapping("/path-counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> pathCounts(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.getPathTreeNodeCounts(req)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<SySite>> create(@RequestBody SySite body) {
        SySite result = boSySiteService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SySite>> update(@PathVariable("id") String id, @RequestBody SySite body) {
        SySite result = boSySiteService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SySite>> upsert(@PathVariable("id") String id, @RequestBody SySite body) {
        return ResponseEntity.ok(ApiResponse.ok(boSySiteService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSySiteService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SySite> rows) {
        boSySiteService.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
