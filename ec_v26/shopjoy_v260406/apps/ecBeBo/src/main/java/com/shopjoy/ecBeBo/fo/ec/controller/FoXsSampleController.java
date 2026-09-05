package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.zz.service.ZzSample1Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FO 전시 샘플 화면(pages/fo/xs/Sample*.js)용 CRUD API.
 *
 * <p>이 화면들은 원래 프론트에서 {@code /api/base/sy/zz-sample1} 을 직접 호출했다.
 * 클라이언트의 {@code /api/base/**} 직접 호출은 금지돼 있다 — 인증·권한 체크,
 * 감사 로그, 헤더 검증이 bo/fo 레이어에서 수행되기 때문이다
 * (정책: {@code base.기술-api.md} §3.5). 그래서 FO 레이어 경로를 따로 둔다.</p>
 *
 * <p>비즈니스 로직이 없는 단순 CRUD 위임이므로 같은 §3.5 예외에 따라
 * base Service 를 직접 주입한다.</p>
 *
 * <ul>
 *   <li>{@code GET    /api/fo/xs/sample1}       — 목록 (cdGrp 로 화면별 구분)</li>
 *   <li>{@code POST   /api/fo/xs/sample1}       — 생성</li>
 *   <li>{@code PUT    /api/fo/xs/sample1/{id}}  — 수정</li>
 *   <li>{@code DELETE /api/fo/xs/sample1/{id}}  — 삭제</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/fo/xs/sample1")
@RequiredArgsConstructor
public class FoXsSampleController {

    private final ZzSample1Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample1Dto.Item>>> list(
            @Valid @ModelAttribute ZzSample1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample1>> create(@Valid @RequestBody ZzSample1 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample1>> update(
            @PathVariable("id") String id, @Valid @RequestBody ZzSample1 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
