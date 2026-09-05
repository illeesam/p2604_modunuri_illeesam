package com.shopjoy.ecBeBo.base.ec.pm.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/discnt")
@RequiredArgsConstructor
public class PmDiscntController {

    private final PmDiscntService service;

    /* 할인 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 할인 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmDiscntDto.Item>>> list(@Valid @ModelAttribute PmDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 할인 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<PmDiscntDto.Item>>> page(@Valid @ModelAttribute PmDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 할인 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmDiscnt>> create(@Valid @RequestBody PmDiscnt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 할인 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscnt>> save(@PathVariable("id") String id, @Valid @RequestBody PmDiscnt entity) {
        entity.setDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 할인 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscnt>> updateSelective(@PathVariable("id") String id, @Valid @RequestBody PmDiscnt entity) {
        entity.setDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 할인 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmDiscnt>> saveOneCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody PmDiscnt entity) {
        PmDiscnt result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<PmDiscnt> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
