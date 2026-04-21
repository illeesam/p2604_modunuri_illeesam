package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 전시(ec-dp) 정보 캐시.
 *
 * 저장 항목:
 *   - 전시 상세  : disp:dtl:{dispId}   → Map<String, Object>
 *   - 전시 목록  : disp:list:{siteId}  → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-dp-disp-seconds (기본 1800s = 30분)
 *
 * secondary Redis 가 설정된 경우 secondary 에 저장한다.
 */
@Component
@RequiredArgsConstructor
public class EcDpDispRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String dispId, Map<String, Object> dispDetail) {
        redis.set(CacheKey.EC_DP_DISP_DTL + dispId, dispDetail,
                props.getTtl().getEcDpDispSeconds(), target());
    }

    public void saveList(String siteId, List<Map<String, Object>> dispList) {
        redis.set(CacheKey.EC_DP_DISP_ALL + siteId, dispList,
                props.getTtl().getEcDpDispSeconds(), target());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String dispId) {
        return redis.get(CacheKey.EC_DP_DISP_DTL + dispId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getList(String siteId) {
        return redis.get(CacheKey.EC_DP_DISP_ALL + siteId, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictDetail(String dispId) {
        redis.delete(CacheKey.EC_DP_DISP_DTL + dispId, target());
    }

    public void evictList(String siteId) {
        redis.delete(CacheKey.EC_DP_DISP_ALL + siteId, target());
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_DP_DISP_DTL + "*", target());
        redis.deleteByPattern(CacheKey.EC_DP_DISP_ALL   + "*", target());
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
