package com.shopjoy.ecBeBo.md.cb.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbSymbolDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbSymbol;
import com.shopjoy.ecBeBo.md.cb.service.MdCbSymbolService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 코바늘 기호 사전 API — /api/cb/symbol
 * FO(도안 편집 팔레트) / BO(기호 사전 관리) 공용. 권한 구분 없이 전체 CRUD 노출.
 */
@RestController
@RequestMapping("/api/md/cb/symbol")
@RequiredArgsConstructor
public class MdCbSymbolController {

    private final MdCbSymbolService mdCbSymbolService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MdCbSymbolDto.Item>>> list(@Valid @ModelAttribute MdCbSymbolDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbSymbolService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<MdCbSymbolDto.Item>>> page(@Valid @ModelAttribute MdCbSymbolDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbSymbolService.getPageData(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MdCbSymbolDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbSymbolService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MdCbSymbol>> create(@Valid @RequestBody MdCbSymbol body) {
        return ResponseEntity.status(201).body(ApiResponse.created(mdCbSymbolService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MdCbSymbol>> update(@PathVariable("id") String id, @Valid @RequestBody MdCbSymbol body) {
        return ResponseEntity.ok(ApiResponse.ok(mdCbSymbolService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        mdCbSymbolService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(@PathVariable("cmd") String cmd, @Valid @RequestBody List<MdCbSymbol> rows) {
        switch (cmd) {
            case "base" -> mdCbSymbolService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
