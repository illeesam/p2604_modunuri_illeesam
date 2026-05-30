package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmChattMsgService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/chatt-msg")
@RequiredArgsConstructor
public class CmChattMsgController {

    private final CmChattMsgService service;

    /* 채팅 메시지 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattMsgDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 채팅 메시지 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattMsgDto.Item>>> list(@Valid @ModelAttribute CmChattMsgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 채팅 메시지 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmChattMsgDto.PageResponse>> page(@Valid @ModelAttribute CmChattMsgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 채팅 메시지 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmChattMsg>> create(@RequestBody CmChattMsg entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 채팅 메시지 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattMsg>> save(@PathVariable("id") String id, @RequestBody CmChattMsg entity) {
        entity.setChattMsgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 채팅 메시지 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattMsg>> updateSelective(@PathVariable("id") String id, @RequestBody CmChattMsg entity) {
        entity.setChattMsgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 채팅 메시지 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<CmChattMsg>> saveDefault(@RequestBody CmChattMsg entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<CmChattMsg>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody CmChattMsg entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmChattMsg> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<CmChattMsg> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
