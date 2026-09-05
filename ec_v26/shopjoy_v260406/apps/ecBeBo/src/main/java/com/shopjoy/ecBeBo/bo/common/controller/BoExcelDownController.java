package com.shopjoy.ecBeBo.bo.common.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecBeBo.bo.common.service.BoExcelDownService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * BO 엑셀 다운로드 API — 즉시/예약 실행과 이력 조회.
 *
 * <pre>
 *  GET  /api/bo/exceldown/status/{domain}   상태(진행중/대기/건수/임계) 조회 — [엑셀] 클릭 시
 *  GET  /api/bo/exceldown/sync/{domain}     즉시 다운로드 (xlsx 스트리밍)
 *  POST /api/bo/exceldown/async/{domain}    예약 접수 (WAITING 등록 후 즉시 반환)
 *  GET  /api/bo/exceldown/page              이력 목록 (기본 조건: 내 요청)
 *  GET  /api/bo/exceldown/{id}              상세 + 생성 파일 목록
 *  POST /api/bo/exceldown/{id}/cancel       강제취소
 *  POST /api/bo/exceldown/{id}/downloaded   다운로드 횟수 +1
 * </pre>
 */
@RestController
@RequestMapping("/api/bo/exceldown")
@RequiredArgsConstructor
public class BoExcelDownController {

    private final BoExcelDownService boExcelDownService;

    /** 상태 조회 — 화면이 즉시/예약 버튼 활성화를 판단하는 근거 */
    @GetMapping("/status/{domain}")
    public ResponseEntity<ApiResponse<SyExceldownDto.Status>> status(
            @PathVariable("domain") String domain,
            @RequestParam Map<String, Object> queryParams) {
        return ResponseEntity.ok(ApiResponse.ok(boExcelDownService.getStatus(domain, queryParams)));
    }

    /** 즉시 다운로드 — 응답이 파일이므로 ApiResponse 로 감싸지 않는다 */
    @GetMapping("/sync/{domain}")
    public void sync(@PathVariable("domain") String domain,
                     @RequestParam Map<String, Object> queryParams,
                     @RequestHeader(value = "X-UI-Nm", required = false) String uiNm,
                     HttpServletResponse response) throws java.io.IOException {
        boExcelDownService.exportSync(domain, queryParams, decode(uiNm), response);
    }

    /** 예약 접수 */
    @PostMapping("/async/{domain}")
    public ResponseEntity<ApiResponse<SyExceldownDto.Item>> async(
            @PathVariable("domain") String domain,
            @RequestParam Map<String, Object> queryParams,
            @RequestHeader(value = "X-UI-Nm", required = false) String uiNm) {
        return ResponseEntity.ok(ApiResponse.ok(
            boExcelDownService.requestAsync(domain, queryParams, decode(uiNm)),
            "예약되었습니다. 완료되면 알림으로 알려드립니다."));
    }

    /** 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<SyExceldownDto.Item>>> page(
            @Valid @ModelAttribute SyExceldownDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boExcelDownService.getPageData(req)));
    }

    /** 상세 (생성 파일 목록 포함) */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyExceldownDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boExcelDownService.getById(id)));
    }

    /** 강제취소 */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable("id") String id) {
        boExcelDownService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "취소되었습니다."));
    }

    /** 다운로드 횟수 +1 — 파일 링크 클릭 시 화면이 호출 */
    @PostMapping("/{id}/downloaded")
    public ResponseEntity<ApiResponse<Void>> downloaded(@PathVariable("id") String id) {
        boExcelDownService.markDownloaded(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** X-UI-Nm 은 한글이라 URL 인코딩되어 온다 */
    private String decode(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return java.net.URLDecoder.decode(v, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return v;
        }
    }
}
