package com.shopjoy.ecBeBo.base.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecBeBo.base.sy.service.SyhSendMsgLogService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/send-msg-log")
@RequiredArgsConstructor
public class SyhSendMsgLogController {

    private final SyhSendMsgLogService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhSendMsgLogDto.Item>> getById(@PathVariable("id") String id) {
        SyhSendMsgLogDto.Item result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhSendMsgLogDto.Item>>> list(@Valid @ModelAttribute SyhSendMsgLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyhSendMsgLogDto.Item>>> page(@Valid @ModelAttribute SyhSendMsgLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }
}
