package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhUserLoginLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/user-login-log")
@RequiredArgsConstructor
public class SyhUserLoginLogController {

    private final SyhUserLoginLogService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserLoginLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhUserLoginLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhUserLoginLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhUserLoginLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserLoginLogDto>> getById(@PathVariable("id") String id) {
        SyhUserLoginLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        service.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
