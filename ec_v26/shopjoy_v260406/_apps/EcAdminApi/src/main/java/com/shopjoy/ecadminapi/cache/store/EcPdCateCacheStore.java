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
 * 카테고리(ec-pd-cate) 정보 캐시.
 *
 * 저장 항목:
 *   - 카테고리 상세  : ec:pd:cate:dtl:{cateId}  → Map<String, Object>
 *   - 카테고리 전체  : ec:pd:cate:all            → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-pd-cate-seconds (기본 3600s = 1시간)
 * secondary Redis 가 설정된 경우 secondary 에 저장한다.
 */
@Component
@RequiredArgsConstructor
public class EcPdCateCacheStore {

    private final RedisUtil       redis;
    private final RedisProperties props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String cateId, Map<String, Object> detail) {
        redis.set(CacheKey.EC_PD_CATE_DTL + cateId, detail,
                props.getTtl().getEcPdCateSeconds(), target());
    }

    public void saveAll(List<Map<String, Object>> list) {
        redis.set(CacheKey.EC_PD_CATE_ALL, list,
                props.getTtl().getEcPdCateSeconds(), target());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String cateId) {
        return redis.get(CacheKey.EC_PD_CATE_DTL + cateId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getAll() {
        return redis.get(CacheKey.EC_PD_CATE_ALL, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evict(String cateId) {
        redis.delete(CacheKey.EC_PD_CATE_DTL + cateId, target());
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_PD_CATE_DTL + "*", target());
        redis.delete(CacheKey.EC_PD_CATE_ALL, target());
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
