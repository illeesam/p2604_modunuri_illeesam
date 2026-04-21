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
 * 상품(ec-pd) 정보 캐시.
 *
 * 저장 항목:
 *   - 상품 상세  : prod:dtl:{prodId}   → Map<String, Object>
 *   - 상품 목록  : prod:list:{siteId}  → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-pd-prod-seconds (기본 1800s = 30분)
 *
 * secondary Redis 가 설정된 경우 상품 캐시는 secondary 에 저장한다.
 */
@Component
@RequiredArgsConstructor
public class EcPdProdCacheStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String prodId, Map<String, Object> prodDetail) {
        redis.set(CacheKey.EC_PD_PROD_DTL + prodId, prodDetail,
                props.getTtl().getEcPdProdSeconds(), target());
    }

    public void saveList(String siteId, List<Map<String, Object>> prodList) {
        redis.set(CacheKey.EC_PD_PROD_ALL + siteId, prodList,
                props.getTtl().getEcPdProdSeconds(), target());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String prodId) {
        return redis.get(CacheKey.EC_PD_PROD_DTL + prodId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getList(String siteId) {
        return redis.get(CacheKey.EC_PD_PROD_ALL + siteId, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictDetail(String prodId) {
        redis.delete(CacheKey.EC_PD_PROD_DTL + prodId, target());
    }

    public void evictList(String siteId) {
        redis.delete(CacheKey.EC_PD_PROD_ALL + siteId, target());
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_PD_PROD_DTL + "*", target());
        redis.deleteByPattern(CacheKey.EC_PD_PROD_ALL   + "*", target());
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
