package com.shopjoy.ecBeBo.base.ec.od.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecBeBo.base.ec.od.service.OdhPayChgHistService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/pay-chg-hist")
@RequiredArgsConstructor
public class OdhPayChgHistController {

    private final OdhPayChgHistService service;

    /* 결제 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 결제 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhPayChgHistDto.Item>>> list(@Valid @ModelAttribute OdhPayChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 결제 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<OdhPayChgHistDto.Item>>> page(@Valid @ModelAttribute OdhPayChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 결제 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhPayChgHist>> create(@Valid @RequestBody OdhPayChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 결제 변경 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayChgHist>> save(@PathVariable("id") String id, @Valid @RequestBody OdhPayChgHist entity) {
        entity.setPayChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 결제 변경 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayChgHist>> updateSelective(@PathVariable("id") String id, @Valid @RequestBody OdhPayChgHist entity) {
        entity.setPayChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 결제 변경 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdhPayChgHist>> saveOneCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody OdhPayChgHist entity) {
        OdhPayChgHist result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<OdhPayChgHist> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
