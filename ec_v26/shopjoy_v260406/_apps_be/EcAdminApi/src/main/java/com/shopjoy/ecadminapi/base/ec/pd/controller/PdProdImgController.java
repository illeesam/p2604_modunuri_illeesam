package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-img")
@RequiredArgsConstructor
public class PdProdImgController {

    private final PdProdImgService service;

    /* 상품 이미지 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImgDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 이미지 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdImgDto.Item>>> list(@Valid @ModelAttribute PdProdImgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 이미지 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdImgDto.PageResponse>> page(@Valid @ModelAttribute PdProdImgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 이미지 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdImg>> create(@RequestBody PdProdImg entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 이미지 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImg>> save(@PathVariable("id") String id, @RequestBody PdProdImg entity) {
        entity.setProdImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 상품 이미지 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImg>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdImg entity) {
        entity.setProdImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 이미지 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdProdImg>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdProdImg entity) {
        PdProdImg result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdProdImg> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
