package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nMsgService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/i18n-msg")
@RequiredArgsConstructor
public class SyI18nMsgController {

    private final SyI18nMsgService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyI18nMsgDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        List<SyI18nMsgDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyI18nMsgDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        PageResult<SyI18nMsgDto> result = service.getPageData(p, pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18nMsgDto>> getById(@PathVariable String id) {
        SyI18nMsgDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<SyI18nMsg>> create(@RequestBody SyI18nMsg entity) {
        SyI18nMsg result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18nMsg>> save(
            @PathVariable String id, @RequestBody SyI18nMsg entity) {
        entity.setI18nMsgId(id);
        SyI18nMsg result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody SyI18nMsg entity) {
        entity.setI18nMsgId(id);
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
