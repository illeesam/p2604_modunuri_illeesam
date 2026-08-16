package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 엑셀 다운로드 운영 파라미터 — sy_prop 우선, 없으면 yml/코드 기본값.
 *
 * <p>재기동 없이 운영에서 조정해야 하는 값들이라 {@code @Value} 만으로는 부족하다.
 * {@code CmUploadService.fnCdnHost()} 와 동일한 방식으로 sy_prop 을 먼저 본다.</p>
 *
 * <table>
 *   <tr><th>키</th><th>기본</th><th>의미</th></tr>
 *   <tr><td>app.excel.sync-max-rows</td><td>10000</td><td>즉시(SYNC) 허용 상한. 초과 시 예약 권장</td></tr>
 *   <tr><td>app.excel.split-rows</td><td>50000</td><td>분할 저장 기준 행수. 0=미분할</td></tr>
 *   <tr><td>app.excel.stale-minutes</td><td>3</td><td>heartbeat 무응답 판정 분(고아 회수)</td></tr>
 *   <tr><td>app.excel.keep-days</td><td>7</td><td>생성 파일 보관일수(만료 후 정리 배치가 삭제)</td></tr>
 *   <tr><td>app.excel.chunk-rows</td><td>1000</td><td>DB→Sheet 청크 크기</td></tr>
 * </table>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExcelDownProps {

    private final SyPropRepository syPropRepository;
    private final Environment environment;

    @Value("${app.excel.sync-max-rows:10000}") private int syncMaxRowsFallback;
    @Value("${app.excel.split-rows:50000}")    private int splitRowsFallback;
    @Value("${app.excel.stale-minutes:3}")     private int staleMinutesFallback;
    @Value("${app.excel.keep-days:7}")         private int keepDaysFallback;
    @Value("${app.excel.chunk-rows:1000}")     private int chunkRowsFallback;

    /** 즉시(SYNC) 다운로드 허용 상한 행수 */
    public int syncMaxRows()  { return intProp("app.excel.sync-max-rows", syncMaxRowsFallback); }

    /** 분할 저장 기준 행수 (0 이면 분할하지 않음) */
    public int splitRows()    { return intProp("app.excel.split-rows", splitRowsFallback); }

    /** heartbeat 무응답 판정 분 — 이 시간 넘게 upd_date 가 안 바뀌면 죽은 잡으로 간주 */
    public int staleMinutes() { return Math.max(1, intProp("app.excel.stale-minutes", staleMinutesFallback)); }

    /** 생성 파일 보관일수 */
    public int keepDays()     { return Math.max(1, intProp("app.excel.keep-days", keepDaysFallback)); }

    /** DB→Sheet 청크 크기 */
    public int chunkRows()    { return Math.max(100, intProp("app.excel.chunk-rows", chunkRowsFallback)); }

    /* ── 내부 ────────────────────────────────────────────────── */

    private int intProp(String key, int fallback) {
        String v = strProp(key);
        if (v == null || v.isBlank()) return fallback;
        try {
            return Integer.parseInt(v.trim());
        } catch (NumberFormatException e) {
            log.warn("[ExcelDownProps] sy_prop {} 값이 숫자가 아님 — value={}, fallback={}", key, v, fallback);
            return fallback;
        }
    }

    private String strProp(String key) {
        String profile = environment.getActiveProfiles().length > 0
            ? environment.getActiveProfiles()[0] : "-";
        return syPropRepository.findAll().stream()
            .filter(p -> "Y".equals(p.getUseYn())
                && key.equals(p.getPropKey())
                && profileMatch(p.getPropProfile(), profile))
            .map(SyProp::getPropValue)
            .filter(x -> x != null && !x.isBlank())
            .findFirst().orElse(null);
    }

    /** prop_profile 은 {@code ^local^} 형태의 멀티값. 비어 있거나 all 이면 모든 프로파일에 적용 */
    private boolean profileMatch(String propProfile, String activeProfile) {
        if (propProfile == null || propProfile.isBlank()) return true;
        String p = propProfile.toLowerCase();
        if (p.contains("all")) return true;
        return p.contains("^" + activeProfile.toLowerCase() + "^");
    }
}
