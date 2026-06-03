package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogFileService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/bltn-file")
@RequiredArgsConstructor
public class CmBlogFileController {

    private final CmBlogFileService service;

    /* 게시물 첨부파일 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogFileDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시물 첨부파일 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmBlogFileDto.Item>>> list(@Valid @ModelAttribute CmBlogFileDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시물 첨부파일 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmBlogFileDto.PageResponse>> page(@Valid @ModelAttribute CmBlogFileDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시물 첨부파일 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmBlogFile>> create(@RequestBody CmBlogFile entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시물 첨부파일 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogFile>> save(@PathVariable("id") String id, @RequestBody CmBlogFile entity) {
        entity.setBlogImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 게시물 첨부파일 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmBlogFile>> updateSelective(@PathVariable("id") String id, @RequestBody CmBlogFile entity) {
        entity.setBlogImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시물 첨부파일 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<CmBlogFile>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody CmBlogFile entity) {
        CmBlogFile result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<CmBlogFile> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
