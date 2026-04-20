package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdQnaService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 상품 QnA API
 * GET    /api/bo/ec/pd/qna       — 목록
 * GET    /api/bo/ec/pd/qna/page  — 페이징
 * GET    /api/bo/ec/pd/qna/{id}  — 단건
 * POST   /api/bo/ec/pd/qna       — 등록
 * PUT    /api/bo/ec/pd/qna/{id}  — 수정
 * DELETE /api/bo/ec/pd/qna/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pd/qna")
@RequiredArgsConstructor
@UserOnly
public class BoPdQnaController {
    private final BoPdQnaService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdQnaDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<PdProdQnaDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdProdQnaDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<PdProdQnaDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdProdQna>> create(@RequestBody PdProdQna body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQnaDto>> update(@PathVariable String id, @RequestBody PdProdQna body) {
        PdProdQnaDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
