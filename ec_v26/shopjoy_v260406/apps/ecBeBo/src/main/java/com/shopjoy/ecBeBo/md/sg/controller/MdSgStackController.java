package com.shopjoy.ecBeBo.md.sg.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgStackDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgStack;
import com.shopjoy.ecBeBo.md.sg.service.MdSgStackService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 소스젠 언어/스택 카탈로그 API — /api/md/sg/stack
 * FO(소스젠 편집기 [소스 생성] 팝오버 조회) / BO(관리자 카탈로그 관리) 공용, 권한 구분 없음
 * (md/sg 프로젝트·DDL API 와 동일 방침 — 2026-08-26).
 */
@RestController
@RequestMapping("/api/md/sg/stack")
@RequiredArgsConstructor
public class MdSgStackController {

    private final MdSgStackService mdSgStackService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MdSgStackDto.Item>>> list(@Valid @ModelAttribute MdSgStackDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgStackService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<MdSgStackDto.Item>>> page(@Valid @ModelAttribute MdSgStackDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgStackService.getPageData(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MdSgStackDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgStackService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MdSgStack>> create(@Valid @RequestBody MdSgStack body) {
        return ResponseEntity.status(201).body(ApiResponse.created(mdSgStackService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MdSgStack>> update(@PathVariable("id") String id, @Valid @RequestBody MdSgStack body) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgStackService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        mdSgStackService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- CRUD 그리드 일괄 저장 (cmd 변형, 드래그앤드롭 정렬순서 포함) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<MdSgStack> rows) {
        switch (cmd) {
            case "base" -> mdSgStackService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
