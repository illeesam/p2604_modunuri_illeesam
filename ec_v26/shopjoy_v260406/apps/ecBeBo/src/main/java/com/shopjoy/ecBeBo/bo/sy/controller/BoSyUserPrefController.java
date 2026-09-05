package com.shopjoy.ecBeBo.bo.sy.controller;

import com.shopjoy.ecBeBo.bo.sy.service.BoSyUserPrefService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * BO 사용자 개인화 설정 API — /api/bo/sy/user-pref
 */
@RestController
@RequestMapping("/api/bo/sy/user-pref")
@RequiredArgsConstructor
public class BoSyUserPrefController {

    private final BoSyUserPrefService boSyUserPrefService;

    /** 현재 로그인 사용자의 전체 개인화 설정 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(boSyUserPrefService.getAll()));
    }

    /** 단일(또는 다수) 키 저장 — PUT /save?{prefKey}={prefValue} */
    @PutMapping("/save")
    public ResponseEntity<ApiResponse<Void>> upsert(@RequestParam Map<String, String> p) {
        p.forEach(boSyUserPrefService::upsert);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
