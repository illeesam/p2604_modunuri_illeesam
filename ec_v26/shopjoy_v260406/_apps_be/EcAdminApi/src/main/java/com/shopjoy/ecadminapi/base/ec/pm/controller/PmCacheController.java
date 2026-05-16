package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCacheService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/cache")
@RequiredArgsConstructor
public class PmCacheController {

    private final PmCacheService service;

    /* 캐시(충전금) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCacheDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 캐시(충전금) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCacheDto.Item>>> list(@Valid @ModelAttribute PmCacheDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 캐시(충전금) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCacheDto.PageResponse>> page(@Valid @ModelAttribute PmCacheDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 캐시(충전금) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCache>> create(@RequestBody PmCache entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 캐시(충전금) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCache>> save(@PathVariable("id") String id, @RequestBody PmCache entity) {
        entity.setCacheId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 캐시(충전금) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCache>> updateSelective(@PathVariable("id") String id, @RequestBody PmCache entity) {
        entity.setCacheId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 캐시(충전금) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 캐시(충전금) 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCache> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
