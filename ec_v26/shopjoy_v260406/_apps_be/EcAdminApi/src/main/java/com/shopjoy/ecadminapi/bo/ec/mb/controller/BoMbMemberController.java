package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO MbMember API — /api/bo/ec/mb/member
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member")
@RequiredArgsConstructor
public class BoMbMemberController {

    private final BoMbMemberService boMbMemberService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberDto.Item>>> list(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberDto.PageResponse>> page(@Valid @ModelAttribute MbMemberDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMember>> create(@RequestBody MbMember body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boMbMemberService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMember>> update(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMember>> upsert(@PathVariable("id") String id, @RequestBody MbMember body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemberService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbMemberService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<MbMember> rows) {
        switch (cmd) {
            case "base" -> boMbMemberService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
