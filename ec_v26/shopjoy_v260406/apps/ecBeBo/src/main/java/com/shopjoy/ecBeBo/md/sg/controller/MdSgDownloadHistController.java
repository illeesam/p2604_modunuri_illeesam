package com.shopjoy.ecBeBo.md.sg.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgDownloadHistDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgDownloadHist;
import com.shopjoy.ecBeBo.md.sg.service.MdSgDownloadHistService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 소스젠 다운로드이력 API — /api/md/sg/download-hist
 * FO(다운로드 클릭 시 기록) / BO(관리자 조회) 공용, 권한 구분 없음 (md/sg 동일 방침).
 */
@RestController
@RequestMapping("/api/md/sg/download-hist")
@RequiredArgsConstructor
public class MdSgDownloadHistController {

    private final MdSgDownloadHistService mdSgDownloadHistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MdSgDownloadHistDto.Item>>> list(@Valid @ModelAttribute MdSgDownloadHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgDownloadHistService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<MdSgDownloadHistDto.Item>>> page(@Valid @ModelAttribute MdSgDownloadHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgDownloadHistService.getPageData(req)));
    }

    /** create — FO [⬇ ZIP 다운로드] 클릭 시 1건 기록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MdSgDownloadHist>> create(@Valid @RequestBody MdSgDownloadHist body) {
        return ResponseEntity.status(201).body(ApiResponse.created(mdSgDownloadHistService.create(body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        mdSgDownloadHistService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
