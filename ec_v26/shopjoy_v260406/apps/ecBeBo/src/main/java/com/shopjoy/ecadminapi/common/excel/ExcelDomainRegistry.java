package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 모든 {@link ExcelDomainHandler} 빈을 Spring 컨텍스트에서 자동 수집하여 key 기준으로 조회 제공.
 *
 * <p>{@link com.shopjoy.ecadminapi.bo.common.controller.BoExcelController} 가
 * {@code /bo/excel/{domain}/...} 요청 시 domain 으로 핸들러를 찾아 위임한다.
 *
 * <p>같은 key 가 여러 빈에 중복 선언되면 컨텍스트 로딩 시 실패시켜 조기 발견 — 이건
 * 사람이 직접 등록한 {@code @Bean} 간의 실수라 즉시 빌드 실패로 잡아야 한다.
 *
 * <p><b>{@link AutoExcelDomainScanner}(자동탐색, 앱 기동 완료 후 백그라운드) 가 추가하는 항목은
 * 다르다</b> — {@link #registerIfAbsent} 로 들어오며, 이미 명시적으로 등록된 key 와 겹치면
 * "명시적 등록이 항상 우선"이라는 규칙에 따라 조용히 스킵한다(예외 던지지 않음). 자동탐색은
 * 사람이 검증하지 않은 추정이므로, 실패를 앱 전체를 죽이는 방식이 아니라 해당 도메인만
 * 건너뛰는 방식으로 처리하는 게 맞다 — 상세 이유는 {@link AutoExcelDomainScanner} 클래스 주석.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExcelDomainRegistry {

    private final List<ExcelDomainHandler<?, ?, ?>> handlers;
    /** ConcurrentHashMap — 자동탐색 스레드가 앱 기동 완료 후(이미 요청을 받는 도중) 추가할 수 있어 동시성 안전 필요 */
    private final Map<String, ExcelDomainHandler<?, ?, ?>> byKey = new ConcurrentHashMap<>();

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
        log.info("[ExcelDomainRegistry] {} 개 도메인(명시 등록) : {}", byKey.size(), byKey.keySet());
    }

    /**
     * 자동탐색 결과 등록 — 이미 있는 key(명시적 {@code @Bean})는 건드리지 않고 조용히 스킵한다.
     * @return 새로 등록됐으면 true, 이미 존재해서 스킵했으면 false
     */
    public boolean registerIfAbsent(ExcelDomainHandler<?, ?, ?> handler) {
        return byKey.putIfAbsent(handler.key(), handler) == null;
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
