package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-status-hist")
@RequiredArgsConstructor
public class PdhProdStatusHistController {

    private final PdhProdStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdStatusHistDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        List<PdhProdStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdStatusHistDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);
        PageResult<PdhProdStatusHistDto> result = service.getPageData(p, pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHistDto>> getById(@PathVariable String id) {
        PdhProdStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildParam(String siteId, String kw,
                                           String dateStart, String dateEnd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId    != null) p.put("siteId",    siteId);
        if (kw        != null) p.put("kw",        kw);
        if (dateStart != null) p.put("dateStart", dateStart);
        if (dateEnd   != null) p.put("dateEnd",   dateEnd);
        if (sort      != null) p.put("sort",      sort);
        return p;
    }
}
