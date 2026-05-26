package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 모든 {@link ExcelDomainHandler} 빈을 Spring 컨텍스트에서 자동 수집하여 key 기준으로 조회 제공.
 *
 * <p>{@link com.shopjoy.ecadminapi.bo.common.controller.BoExcelController} 가
 * {@code /bo/excel/{domain}/...} 요청 시 domain 으로 핸들러를 찾아 위임한다.
 *
 * <p>같은 key 가 여러 빈에 중복 선언되면 컨텍스트 로딩 시 실패시켜 조기 발견.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExcelDomainRegistry {

    private final List<ExcelDomainHandler<?, ?, ?>> handlers;
    private final Map<String, ExcelDomainHandler<?, ?, ?>> byKey = new HashMap<>();

    @PostConstruct
    void init() {
        for (ExcelDomainHandler<?, ?, ?> h : handlers) {
            String k = h.key();
            if (k == null || k.isBlank()) {
                throw new IllegalStateException("ExcelDomainHandler 의 key 가 비어있습니다: " + h.getClass().getName());
            }
            ExcelDomainHandler<?, ?, ?> prev = byKey.put(k, h);
            if (prev != null) {
                throw new IllegalStateException(
                    "ExcelDomainHandler key 중복: '" + k + "' — "
                    + prev.getClass().getName() + " vs " + h.getClass().getName()
                );
            }
        }
        log.info("[ExcelDomainRegistry] {} 개 도메인 등록: {}", byKey.size(), byKey.keySet());
    }

    /** key 로 핸들러 조회. 미존재 시 CmBizException. */
    public ExcelDomainHandler<?, ?, ?> get(String key) {
        ExcelDomainHandler<?, ?, ?> h = byKey.get(key);
        if (h == null) {
            throw new CmBizException("등록되지 않은 엑셀 도메인입니다: " + key);
        }
        return h;
    }

    /** 전체 도메인 메타 — 프론트 select 옵션 동적 생성용 */
    public List<Map<String, String>> listAll() {
        return byKey.values().stream()
            .map(h -> Map.of("key", h.key(), "label", h.label()))
            .toList();
    }
}
