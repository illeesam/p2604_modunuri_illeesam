package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 카테고리 상품(ec-pd-cate-prod) 정보 캐시.
 *
 * 저장 항목:
 *   - 상품 상세  : ec:pd:cate:prod:dtl:{prodId}   → Map<String, Object>
 *   - 상품 목록  : ec:pd:cate:prod:all:{cateId}   → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-pd-cate-prod-seconds (기본 3600s = 1시간)
 * secondary Redis 가 설정된 경우 secondary 에 저장한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EcPdCateProdRedisStore {

    private final RedisUtil       redis;
    private final RedisProperties props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String prodId, Map<String, Object> detail) {
        redis.set(CacheKey.EC_PD_CATE_PROD_DTL + prodId, detail,
                props.getTtl().getEcPdCateProdSeconds(), target());
        log.info("[Cache][redis] [ec-pd-cate-prod:dtl][{}] saveDetail()", prodId);
    }

    public void saveList(String cateId, List<Map<String, Object>> list) {
        redis.set(CacheKey.EC_PD_CATE_PROD_ALL + cateId, list,
                props.getTtl().getEcPdCateProdSeconds(), target());
        log.info("[Cache][redis] [ec-pd-cate-prod:list][{}] saveList()— {}건", cateId, list.size());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String prodId) {
        return redis.get(CacheKey.EC_PD_CATE_PROD_DTL + prodId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getList(String cateId) {
        return redis.get(CacheKey.EC_PD_CATE_PROD_ALL + cateId, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictDetail(String prodId) {
        redis.delete(CacheKey.EC_PD_CATE_PROD_DTL + prodId, target());
    }

    public void evictList(String cateId) {
        redis.delete(CacheKey.EC_PD_CATE_PROD_ALL + cateId, target());
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_PD_CATE_PROD_DTL + "*", target());
        redis.deleteByPattern(CacheKey.EC_PD_CATE_PROD_ALL + "*", target());
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
