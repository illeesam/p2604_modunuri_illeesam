package com.shopjoy.ecadminapi.md.cb.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbYarnDto;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbYarn;
import com.shopjoy.ecadminapi.md.cb.service.MdCbYarnService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 코바늘 실 마스터 API — /api/cb/yarn
 * FO / BO 공용. 권한 구분 없이 전체 CRUD 노출.
 */
@RestController
@RequestMapping("/api/md/cb/yarn")
@RequiredArgsConstructor
public class MdCbYarnController {

    private final MdCbYarnService mdCbYarnService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MdCbYarnDto.Item>>> list(@Valid @ModelAttribute MdCbYarnDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbYarnService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<MdCbYarnDto.Item>>> page(@Valid @ModelAttribute MdCbYarnDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbYarnService.getPageData(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MdCbYarnDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbYarnService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MdCbYarn>> create(@Valid @RequestBody MdCbYarn body) {
        return ResponseEntity.status(201).body(ApiResponse.created(mdCbYarnService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MdCbYarn>> update(@PathVariable("id") String id, @Valid @RequestBody MdCbYarn body) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbYarnService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        mdCbYarnService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(@PathVariable("cmd") String cmd, @Valid @RequestBody List<MdCbYarn> rows) {
        switch (cmd) {
            case "base" -> mdCbYarnService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
