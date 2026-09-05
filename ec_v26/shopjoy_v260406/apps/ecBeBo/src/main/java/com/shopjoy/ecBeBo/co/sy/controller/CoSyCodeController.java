package com.shopjoy.ecBeBo.co.sy.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecBeBo.base.sy.service.SyCodeService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공통코드 공용 API — /api/co/sy/code
 * 인가: FO·BO 모두 접근 가능 (읽기 전용)
 */
@RestController
@RequestMapping("/api/co/sy/code")
@RequiredArgsConstructor
public class CoSyCodeController {

    private final SyCodeService syCodeService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> list(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getList(req)));
    }

    /**
     * 코드그룹 배치 조회 — 화면이 필요한 그룹만 한 번에 받는다.
     *
     * <p>{@code GET /api/co/sy/code/groups?codeGrps=PROD_TYPE,PRODUCT_STATUS}</p>
     *
     * <p>부팅 시 전체 코드(133종)를 싣지 않고 화면 단위로 지연 로딩하기 위한 엔드포인트다.
     * 프론트는 codeStore.saEnsureGrps([...]) 에서 캐시에 없는 그룹만 모아 한 번 호출한다.</p>
     */
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> groups(
            @RequestParam("codeGrps") List<String> codeGrps,
            @RequestParam(value = "siteId", required = false) String siteId) {
        SyCodeDto.Request req = new SyCodeDto.Request();
        req.setCodeGrps(codeGrps);
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyCodeDto.Item>>> page(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(syCodeService.getPageData(req)));
    }
}
