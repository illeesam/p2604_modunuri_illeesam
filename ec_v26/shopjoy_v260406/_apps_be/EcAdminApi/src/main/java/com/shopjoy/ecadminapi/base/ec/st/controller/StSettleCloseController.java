package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleCloseService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-close")
@RequiredArgsConstructor
public class StSettleCloseController {

    private final StSettleCloseService service;

    /* 정산 마감 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleCloseDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 마감 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleCloseDto.Item>>> list(@Valid @ModelAttribute StSettleCloseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 마감 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleCloseDto.PageResponse>> page(@Valid @ModelAttribute StSettleCloseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 마감 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleClose>> create(@RequestBody StSettleClose entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 마감 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleClose>> save(@PathVariable("id") String id, @RequestBody StSettleClose entity) {
        entity.setSettleCloseId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 정산 마감 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleClose>> updateSelective(@PathVariable("id") String id, @RequestBody StSettleClose entity) {
        entity.setSettleCloseId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 마감 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<StSettleClose>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody StSettleClose entity) {
        StSettleClose result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<StSettleClose> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
