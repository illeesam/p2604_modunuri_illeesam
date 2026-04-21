package com.shopjoy.ecadminapi.cache.store;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 전시 항목(ec-dp-disp-item) 정보 캐시.
 *
 * 저장 항목:
 *   - 항목 상세  : ec:dp:disp:item:dtl:{itemId}   → Map<String, Object>
 *   - 항목 목록  : ec:dp:disp:item:all:{dispId}   → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-dp-disp-item-seconds (기본 3600s = 1시간)
 * secondary Redis 가 설정된 경우 secondary 에 저장한다.
 */
@Component
@RequiredArgsConstructor
public class EcDpDispItemCacheStore {

    private final RedisUtil       redis;
    private final RedisProperties props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String itemId, Map<String, Object> detail) {
        redis.set(CacheKey.EC_DP_DISP_ITEM_DTL + itemId, detail,
                props.getTtl().getEcDpDispItemSeconds(), target());
    }

    public void saveList(String dispId, List<Map<String, Object>> list) {
        redis.set(CacheKey.EC_DP_DISP_ITEM_ALL + dispId, list,
                props.getTtl().getEcDpDispItemSeconds(), target());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String itemId) {
        return redis.get(CacheKey.EC_DP_DISP_ITEM_DTL + itemId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getList(String dispId) {
        return redis.get(CacheKey.EC_DP_DISP_ITEM_ALL + dispId, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictDetail(String itemId) {
        redis.delete(CacheKey.EC_DP_DISP_ITEM_DTL + itemId, target());
    }

    public void evictList(String dispId) {
        redis.delete(CacheKey.EC_DP_DISP_ITEM_ALL + dispId, target());
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_DP_DISP_ITEM_DTL + "*", target());
        redis.deleteByPattern(CacheKey.EC_DP_DISP_ITEM_ALL + "*", target());
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
