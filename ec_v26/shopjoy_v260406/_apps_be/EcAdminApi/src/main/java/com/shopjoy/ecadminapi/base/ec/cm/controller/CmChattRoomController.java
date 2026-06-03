package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmChattRoomService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/chatt-room")
@RequiredArgsConstructor
public class CmChattRoomController {

    private final CmChattRoomService service;

    /* 채팅방 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoomDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 채팅방 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmChattRoomDto.Item>>> list(@Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 채팅방 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmChattRoomDto.PageResponse>> page(@Valid @ModelAttribute CmChattRoomDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 채팅방 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmChattRoom>> create(@RequestBody CmChattRoom entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 채팅방 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoom>> save(@PathVariable("id") String id, @RequestBody CmChattRoom entity) {
        entity.setChattRoomId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 채팅방 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmChattRoom>> updateSelective(@PathVariable("id") String id, @RequestBody CmChattRoom entity) {
        entity.setChattRoomId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 채팅방 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<CmChattRoom>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody CmChattRoom entity) {
        CmChattRoom result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<CmChattRoom> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
