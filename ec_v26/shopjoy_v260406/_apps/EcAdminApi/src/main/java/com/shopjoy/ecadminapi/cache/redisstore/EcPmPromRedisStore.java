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
 * 프로모션(ec-pm) 정보 캐시.
 *
 * 저장 항목:
 *   - 프로모션 상세  : prom:dtl:{promId}   → Map<String, Object>
 *   - 프로모션 목록  : prom:list:{siteId}  → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-pm-prom-seconds (기본 1800s = 30분)
 *
 * secondary Redis 가 설정된 경우 secondary 에 저장한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EcPmPromRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String promId, Map<String, Object> promDetail) {
        redis.set(CacheKey.EC_PM_PROM_DTL + promId, promDetail,
                props.getTtl().getEcPmPromSeconds(), target());
        log.info("[Cache][redis] [ec-pm-prom:dtl][{}] saveDetail()", promId);
    }

    public void saveList(String siteId, List<Map<String, Object>> promList) {
        redis.set(CacheKey.EC_PM_PROM_ALL + siteId, promList,
                props.getTtl().getEcPmPromSeconds(), target());
        log.info("[Cache][redis] [ec-pm-prom:list][{}] saveList()— {}건", siteId, promList.size());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String promId) {
        return redis.get(CacheKey.EC_PM_PROM_DTL + promId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getList(String siteId) {
        return redis.get(CacheKey.EC_PM_PROM_ALL + siteId, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictDetail(String promId) {
        redis.delete(CacheKey.EC_PM_PROM_DTL + promId, target());
    }

    public void evictList(String siteId) {
        redis.delete(CacheKey.EC_PM_PROM_ALL + siteId, target());
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_PM_PROM_DTL + "*", target());
        redis.deleteByPattern(CacheKey.EC_PM_PROM_ALL   + "*", target());
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }

    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
