package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleEtcAdjService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-etc-adj")
@RequiredArgsConstructor
public class StSettleEtcAdjController {

    private final StSettleEtcAdjService service;

    /* 정산 기타 조정 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdjDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 기타 조정 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleEtcAdjDto.Item>>> list(@Valid @ModelAttribute StSettleEtcAdjDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 기타 조정 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleEtcAdjDto.PageResponse>> page(@Valid @ModelAttribute StSettleEtcAdjDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 기타 조정 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> create(@RequestBody StSettleEtcAdj entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 기타 조정 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> save(@PathVariable("id") String id, @RequestBody StSettleEtcAdj entity) {
        entity.setSettleEtcAdjId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 정산 기타 조정 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> updateSelective(@PathVariable("id") String id, @RequestBody StSettleEtcAdj entity) {
        entity.setSettleEtcAdjId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 기타 조정 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody StSettleEtcAdj entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<StSettleEtcAdj> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
