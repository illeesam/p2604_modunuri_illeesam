package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.service.SyVocService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/voc")
@RequiredArgsConstructor
public class SyVocController {

    private final SyVocService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVocDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        List<SyVocDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyVocDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        PageResult<SyVocDto> result = service.getPageData(p, pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVocDto>> getById(@PathVariable String id) {
        SyVocDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<SyVoc>> create(@RequestBody SyVoc entity) {
        SyVoc result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVoc>> save(
            @PathVariable String id, @RequestBody SyVoc entity) {
        entity.setVocId(id);
        SyVoc result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody SyVoc entity) {
        entity.setVocId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    private Map<String, Object> buildParam(String siteId, String kw,
                                           String dateStart, String dateEnd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId    != null) p.put("siteId",    siteId);
        if (kw        != null) p.put("kw",        kw);
        if (dateStart != null) p.put("dateStart", dateStart);
        if (dateEnd   != null) p.put("dateEnd",   dateEnd);
        if (sort      != null) p.put("sort",      sort);
        return p;
    }
}
