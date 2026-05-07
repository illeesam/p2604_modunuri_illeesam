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
 * 프로모션 항목(ec-pm-prom-item) 정보 캐시.
 *
 * 저장 항목:
 *   - 항목 상세  : ec:pm:prom:item:dtl:{itemId}   → Map<String, Object>
 *   - 항목 목록  : ec:pm:prom:item:all:{promId}   → List<Map<String, Object>>
 *
 * TTL: app.redis.ttl.ec-pm-prom-item-seconds (기본 3600s = 1시간)
 * secondary Redis 가 설정된 경우 secondary 에 저장한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EcPmPromItemRedisStore {

    private final RedisUtil       redis;
    private final RedisProperties props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveDetail(String itemId, Map<String, Object> detail) {
        redis.set(CacheKey.EC_PM_PROM_ITEM_DTL + itemId, detail,
                props.getTtl().getEcPmPromItemSeconds(), target());
        log.info("[Cache][redis] [ec-pm-prom-item:dtl][{}] saveDetail()", itemId);
    }

    /** saveList — 저장 */
    public void saveList(String promId, List<Map<String, Object>> list) {
        redis.set(CacheKey.EC_PM_PROM_ITEM_ALL + promId, list,
                props.getTtl().getEcPmPromItemSeconds(), target());
        log.info("[Cache][redis] [ec-pm-prom-item:list][{}] saveList()— {}건", promId, list.size());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getDetail(String itemId) {
        return redis.get(CacheKey.EC_PM_PROM_ITEM_DTL + itemId, Map.class, target())
                .map(m -> (Map<String, Object>) m);
    }

    /** getList — 조회 */
    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getList(String promId) {
        return redis.get(CacheKey.EC_PM_PROM_ITEM_ALL + promId, List.class, target())
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictDetail(String itemId) {
        redis.delete(CacheKey.EC_PM_PROM_ITEM_DTL + itemId, target());
    }

    /** evictList */
    public void evictList(String promId) {
        redis.delete(CacheKey.EC_PM_PROM_ITEM_ALL + promId, target());
    }

    /** evictAll */
    public void evictAll() {
        redis.deleteByPattern(CacheKey.EC_PM_PROM_ITEM_DTL + "*", target());
        redis.deleteByPattern(CacheKey.EC_PM_PROM_ITEM_ALL + "*", target());
    }

    /** isEnabled — 여부 */
    public boolean isEnabled() {
        return redis.isEnabled();
    }

    /** target */
    private RedisUtil.Target target() {
        return redis.hasSecondary() ? RedisUtil.Target.SECONDARY : RedisUtil.Target.PRIMARY;
    }
}
