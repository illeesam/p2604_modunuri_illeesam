package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nMsgService;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * BO 다국어 API — /api/bo/sy/i18n
 */
@RestController
@RequestMapping("/api/bo/sy/i18n")
@RequiredArgsConstructor
@BoOnly
public class BoSyI18nController {

    private final SyI18nService service;
    private final SyI18nMsgService msgService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyI18nDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyI18nDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18nDto>> getById(@PathVariable String id) {
        SyI18nDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyI18n>> create(@RequestBody SyI18n body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyI18n>> update(@PathVariable String id, @RequestBody SyI18n body) {
        body.setI18nId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PutMapping("/{id}/msgs")
    public ResponseEntity<ApiResponse<Void>> saveMsgs(
            @PathVariable String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, String> msgs = (Map<String, String>) body.get("msgs");
        if (msgs == null) return ResponseEntity.ok(ApiResponse.ok(null));
        String updBy = SecurityUtil.getAuthUser().authId();
        msgs.forEach((langCd, msgText) -> {
            Map<String, Object> p = new java.util.HashMap<>();
            p.put("i18nId", id);
            p.put("langCd", langCd);
            List<?> existing = msgService.getList(p);
            if (!existing.isEmpty()) {
                com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto dto =
                    (com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto) existing.get(0);
                SyI18nMsg entity = new SyI18nMsg();
                entity.setI18nMsgId(dto.getI18nMsgId());
                entity.setI18nId(id);
                entity.setLangCd(langCd);
                entity.setI18nMsg(msgText);
                entity.setUpdBy(updBy);
                entity.setUpdDate(LocalDateTime.now());
                msgService.save(entity);
            } else {
                SyI18nMsg entity = new SyI18nMsg();
                entity.setI18nMsgId("IM" + System.currentTimeMillis() + langCd);
                entity.setI18nId(id);
                entity.setLangCd(langCd);
                entity.setI18nMsg(msgText);
                entity.setRegBy(updBy);
                entity.setRegDate(LocalDateTime.now());
                msgService.create(entity);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
