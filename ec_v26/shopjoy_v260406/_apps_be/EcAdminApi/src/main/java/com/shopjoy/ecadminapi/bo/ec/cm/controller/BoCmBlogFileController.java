package com.shopjoy.ecadminapi.bo.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.bo.ec.cm.service.BoCmBlogFileService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 블로그 첨부 이미지 API — /api/bo/ec/cm/blog-file
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/cm/blog-file")
@RequiredArgsConstructor
public class BoCmBlogFileController {

    private final BoCmBlogFileService boCmBlogFileService;

    /* 목록조회 (blogId 필터) */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogFileDto.Item>>> list(@Valid @ModelAttribute CmBlogFileDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boCmBlogFileService.getList(req)));
    }

    /** saveList -- 일괄 저장 (추가/수정/삭제, cmd 변형: base) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<CmBlogFile> rows) {
        switch (cmd) {
            case "base" -> boCmBlogFileService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
