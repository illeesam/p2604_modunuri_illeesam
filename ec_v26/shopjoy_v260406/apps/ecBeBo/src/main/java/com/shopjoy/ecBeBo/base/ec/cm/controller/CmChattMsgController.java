package com.shopjoy.ecBeBo.base.ec.cm.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecBeBo.base.ec.cm.service.CmChattMsgService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<BasePage<CmChattMsgDto.Item>>> page(@Valid @ModelAttribute CmChattMsgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 채팅 메시지 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmChattMsg>> create(@Valid @RequestBody CmChattMsg entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 채팅 메시지 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattMsg>> save(@PathVariable("id") String id, @Valid @RequestBody CmChattMsg entity) {
        entity.setChattMsgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 채팅 메시지 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattMsg>> updateSelective(@PathVariable("id") String id, @Valid @RequestBody CmChattMsg entity) {
        entity.setChattMsgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 채팅 메시지 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<CmChattMsg>> saveOneCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody CmChattMsg entity) {
        CmChattMsg result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<CmChattMsg> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
