package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAlarmRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
/** SyAlarm QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAlarmRepositoryImpl implements QSyAlarmRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAlarmRepositoryImpl";
    private static final QSyAlarm syAlarm = QSyAlarm.syAlarm;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyCode cdAt = new QSyCode("cd_at");
    private static final QSyCode cdAc = new QSyCode("cd_ac");
    private static final QSyCode cdAtt = new QSyCode("cd_att");

    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 알람 키조회 */
    @Override
    public Optional<SyAlarmDto.Item> selectById(String alarmId) {
        SyAlarmDto.Item dto = baseQuery().where(syAlarm.alarmId.eq(alarmId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 알람 목록조회 */
    @Override
    public List<SyAlarmDto.Item> selectList(SyAlarmDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyAlarmDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndAlarmId(search),
                baseAndStatus(search),
                baseAndTypeCd(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 알람 페이지조회 */
    @Override
    public SyAlarmDto.PageResponse selectPageData(SyAlarmDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyAlarmDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndAlarmId(search),
                baseAndStatus(search),
                baseAndTypeCd(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyAlarmDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syAlarm.count()).from(syAlarm).where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndAlarmId(search),
                baseAndStatus(search),
                baseAndTypeCd(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyAlarmDto.PageResponse res = new SyAlarmDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 알람 baseQuery */
    private JPAQuery<SyAlarmDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyAlarmDto.Item.class,
                        syAlarm.alarmId, syAlarm.siteId, syAlarm.alarmTitle, syAlarm.alarmTypeCd, syAlarm.channelCd,
                        syAlarm.targetTypeCd, syAlarm.targetId, syAlarm.templateId, syAlarm.alarmMsg, syAlarm.alarmSendDate,
                        syAlarm.alarmStatusCd, syAlarm.alarmSendCount, syAlarm.alarmFailCount, syAlarm.pathId,
                        syAlarm.regBy, syAlarm.regDate, syAlarm.updBy, syAlarm.updDate,
                        sySite.siteNm.as("siteNm"),
                        cdAt.codeLabel.as("alarmTypeCdNm"),
                        cdAc.codeLabel.as("channelCdNm"),
                        cdAtt.codeLabel.as("targetTypeCdNm")
                ))
                .from(syAlarm)
                .leftJoin(sySite).on(sySite.siteId.eq(syAlarm.siteId))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("ALARM_TYPE").and(cdAt.codeValue.eq(syAlarm.alarmTypeCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ALARM_CHANNEL").and(cdAc.codeValue.eq(syAlarm.channelCd)))
                .leftJoin(cdAtt).on(cdAtt.codeGrp.eq("ALARM_TARGET_TYPE").and(cdAtt.codeValue.eq(syAlarm.targetTypeCd)));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyAlarmDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syAlarm.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression baseAndPathId(SyAlarmDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syAlarm.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_alarm"))
                : null;
    }

    /* alarmId 정확 일치 */
    private BooleanExpression baseAndAlarmId(SyAlarmDto.Request search) {
        return search != null && StringUtils.hasText(search.getAlarmId())
                ? syAlarm.alarmId.eq(search.getAlarmId()) : null;
    }

    /* alarmStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyAlarmDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? syAlarm.alarmStatusCd.eq(search.getStatus()) : null;
    }

    /* alarmTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(SyAlarmDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? syAlarm.alarmTypeCd.eq(search.getTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyAlarmDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",alarmId,", syAlarm.alarmId, pattern);
        or = orLike(or, all, types, ",alarmMsg,", syAlarm.alarmMsg, pattern);
        or = orLike(or, all, types, ",alarmStatusCd,", syAlarm.alarmStatusCd, pattern);
        or = orLike(or, all, types, ",alarmTitle,", syAlarm.alarmTitle, pattern);
        or = orLike(or, all, types, ",alarmTypeCd,", syAlarm.alarmTypeCd, pattern);
        or = orLike(or, all, types, ",channelCd,", syAlarm.channelCd, pattern);
        or = orLike(or, all, types, ",pathId,", syAlarm.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", syAlarm.siteId, pattern);
        or = orLike(or, all, types, ",targetId,", syAlarm.targetId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", syAlarm.targetTypeCd, pattern);
        or = orLike(or, all, types, ",templateId,", syAlarm.templateId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyAlarmDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syAlarm.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syAlarm.alarmId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("alarmId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAlarm.alarmId));
                } else if ("alarmTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAlarm.alarmTitle));
                } else if ("alarmSendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAlarm.alarmSendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syAlarm.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syAlarm.alarmId));
        }
        return orders;
    }

    /* 알람 수정 */
    @Override
    public int updateSelective(SyAlarm entity) {
        if (entity.getAlarmId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syAlarm);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(syAlarm.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getAlarmTitle()     != null) { update.set(syAlarm.alarmTitle,     entity.getAlarmTitle());     hasAny = true; }
        if (entity.getAlarmTypeCd()    != null) { update.set(syAlarm.alarmTypeCd,    entity.getAlarmTypeCd());    hasAny = true; }
        if (entity.getChannelCd()      != null) { update.set(syAlarm.channelCd,      entity.getChannelCd());      hasAny = true; }
        if (entity.getTargetTypeCd()   != null) { update.set(syAlarm.targetTypeCd,   entity.getTargetTypeCd());   hasAny = true; }
        if (entity.getTargetId()       != null) { update.set(syAlarm.targetId,       entity.getTargetId());       hasAny = true; }
        if (entity.getTemplateId()     != null) { update.set(syAlarm.templateId,     entity.getTemplateId());     hasAny = true; }
        if (entity.getAlarmMsg()       != null) { update.set(syAlarm.alarmMsg,       entity.getAlarmMsg());       hasAny = true; }
        if (entity.getAlarmSendDate()  != null) { update.set(syAlarm.alarmSendDate,  entity.getAlarmSendDate());  hasAny = true; }
        if (entity.getAlarmStatusCd()  != null) { update.set(syAlarm.alarmStatusCd,  entity.getAlarmStatusCd());  hasAny = true; }
        if (entity.getAlarmSendCount() != null) { update.set(syAlarm.alarmSendCount, entity.getAlarmSendCount()); hasAny = true; }
        if (entity.getAlarmFailCount() != null) { update.set(syAlarm.alarmFailCount, entity.getAlarmFailCount()); hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syAlarm.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syAlarm.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()         != null) { update.set(syAlarm.pathId,         entity.getPathId());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syAlarm.alarmId.eq(entity.getAlarmId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_alarm 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeAlarmCnts(SyAlarmDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeAlarmCnts() */\n");
        sql.append("""
                WITH RECURSIVE descendants /* 각 path 의 자손 path_id (자신 포함, biz_cd 한정) */ AS (
                    SELECT path_id AS root_id, path_id AS leaf_id
                    FROM sy_path
                    WHERE biz_cd = :bizCd
                    UNION ALL
                    SELECT d.root_id, c.path_id
                    FROM descendants d
                    JOIN sy_path c ON c.parent_path_id = d.leaf_id
                    WHERE c.biz_cd = :bizCd
                ),
                filtered /* 검색조건이 적용된 행 */ AS (
                    SELECT alarm_id, path_id
                    FROM sy_alarm t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_alarm");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndStatus(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.alarm_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.path_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 — 트리 외 표시 */
                  SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                  WHERE path_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }

    /* ============================================================
     * selectPathTreeAlarmCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    /* AND t.alarm_status_cd = :statusCd */
    private void pathtreeAndStatus(SyAlarmDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getStatus())) return;
        sql.append("      AND t.alarm_status_cd = :statusCd\n");
        p.put("statusCd", s.getStatus());
    }

    /* AND ( OR t.col_x ILIKE :searchValue ... ) — searchType csv 로 컬럼 분기 */
    private void pathtreeAndSearchValue(SyAlarmDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",alarmTitle,")) sql.append("         OR t.alarm_title ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",alarmMsg,"))   sql.append("         OR t.alarm_msg   ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    /* AND t.reg_date >= :dateStart AND t.reg_date <= :dateEnd + 1 day */
    private void pathtreeAndDateRange(SyAlarmDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            p.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            p.put("dateEnd", s.getDateEnd());
        }
    }
}
