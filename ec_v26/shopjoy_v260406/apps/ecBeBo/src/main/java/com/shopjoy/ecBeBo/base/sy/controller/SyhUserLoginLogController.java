package com.shopjoy.ecBeBo.base.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecBeBo.base.sy.service.SyhUserLoginLogService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/user-login-log")
@RequiredArgsConstructor
public class SyhUserLoginLogController {

    private final SyhUserLoginLogService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserLoginLogDto.Item>> getById(@PathVariable("id") String id) {
        SyhUserLoginLogDto.Item result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserLoginLogDto.Item>>> list(
            @Valid @ModelAttribute SyhUserLoginLogDto.Request req) {
        List<SyhUserLoginLogDto.Item> result = service.getList(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyhUserLoginLogDto.Item>>> page(
            @Valid @ModelAttribute SyhUserLoginLogDto.Request req) {
        BasePage<SyhUserLoginLogDto.Item> result = service.getPageData(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** deleteAll — 삭제 */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        service.deleteAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
