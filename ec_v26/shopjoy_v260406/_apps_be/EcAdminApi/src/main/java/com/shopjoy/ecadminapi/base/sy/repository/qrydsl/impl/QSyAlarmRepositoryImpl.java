package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAlarm;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAlarmRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyAlarm QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAlarmRepositoryImpl implements QSyAlarmRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAlarmRepositoryImpl";
    private static final QSyAlarm syAlarm = QSyAlarm.syAlarm;
    private static final QVwSyCode cdAt = new QVwSyCode("cd_at");
    private static final QVwSyCode cdAc = new QVwSyCode("cd_ac");
    private static final QVwSyCode cdAtt = new QVwSyCode("cd_att");

    /*
     * baseQuery(baseSelColumnQuery 역할) — 코드성 필드 예시 코드값
     * ALARM_TYPE        {ORDER: '주문', DELIVERY: '배송', CLAIM: '클레임', MARKETING: '마케팅', SYSTEM: '시스템'}
     * ALARM_CHANNEL     {EMAIL: '이메일', SMS: 'SMS', KAKAO: '알림톡', PUSH: '푸시'}
     * ALARM_TARGET_TYPE {MEMBER: '회원', VENDOR: '업체', ADMIN: '관리자', ALL: '전체'}
     * ALARM_STATUS_CD   (sy_code 미등록, DDL 주석 기준) {PENDING: '대기', SENT: '발송완료', FAILED: '실패', CANCELLED: '취소'}
     */
    private JPAQuery<SyAlarmDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyAlarmDto.Item.class,
                        syAlarm.alarmId,          // 알림ID (YYMMDDhhmmss+rand4)
                        syAlarm.alarmTitle,       // 알림제목
                        syAlarm.alarmTypeCd,      // 알림유형 — ALARM_TYPE {ORDER: '주문', DELIVERY: '배송', CLAIM: '클레임', MARKETING: '마케팅', SYSTEM: '시스템'}
                        syAlarm.channelCd,        // 발송채널 — ALARM_CHANNEL {EMAIL: '이메일', SMS: 'SMS', KAKAO: '알림톡', PUSH: '푸시'}
                        syAlarm.targetTypeCd,     // 대상유형 — ALARM_TARGET_TYPE {MEMBER: '회원', VENDOR: '업체', ADMIN: '관리자', ALL: '전체'}
                        syAlarm.targetId,         // 대상ID (회원ID 또는 등급코드)
                        syAlarm.templateId,       // 템플릿ID
                        syAlarm.alarmMsg,         // 발송내용
                        syAlarm.alarmSendDate,    // 발송예정일시
                        syAlarm.alarmStatusCd,    // 발송상태 — ALARM_STATUS_CD {PENDING: '대기', SENT: '발송완료', FAILED: '실패', CANCELLED: '취소'}
                        syAlarm.alarmSendCount,   // 발송성공수
                        syAlarm.alarmFailCount,   // 발송실패수
                        syAlarm.pathId,           // 점(.) 구분 표시경로 (트리 빌드용)
                        syAlarm.regBy,            // 등록자
                        syAlarm.regDate,          // 등록일시
                        syAlarm.updBy,            // 수정자
                        syAlarm.updDate,          // 수정일시
                        cdAt.codeLabel.as("alarmTypeCdNm"),       // 알림유형 라벨 (sy_code ALARM_TYPE 조인)
                        cdAc.codeLabel.as("channelCdNm"),         // 발송채널 라벨 (sy_code ALARM_CHANNEL 조인)
                        cdAtt.codeLabel.as("targetTypeCdNm")      // 대상유형 라벨 (sy_code ALARM_TARGET_TYPE 조인)
                ))
                .from(syAlarm)
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("ALARM_TYPE_CD").and(cdAt.codeValue.eq(syAlarm.alarmTypeCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ALARM_CHANNEL").and(cdAc.codeValue.eq(syAlarm.channelCd)))
                .leftJoin(cdAtt).on(cdAtt.codeGrp.eq("ALARM_TARGET_TYPE").and(cdAtt.codeValue.eq(syAlarm.targetTypeCd)));
    }

    /* 알람 키조회 */
    @Override
    public Optional<SyAlarmDto.Item> selectById(String alarmId) {
        SyAlarmDto.Item dto = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syAlarm.alarmId.eq(alarmId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 알람 목록조회 */
    @Override
    public List<SyAlarmDto.Item> selectList(SyAlarmDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(andPathIdIn(search));
        wheres.add(QdslUtil.strEq(syAlarm.alarmId, search.getAlarmId()));
        wheres.add(QdslUtil.strEq(syAlarm.alarmStatusCd, search.getStatus()));
        wheres.add(QdslUtil.strEq(syAlarm.alarmTypeCd, search.getTypeCd()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyAlarmDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres2)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 알람 페이지조회 */
    @Override
    public BasePage<SyAlarmDto.Item> selectPageData(SyAlarmDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(andPathIdIn(search));
        wheres.add(QdslUtil.strEq(syAlarm.alarmId, search.getAlarmId()));
        wheres.add(QdslUtil.strEq(syAlarm.alarmStatusCd, search.getStatus()));
        wheres.add(QdslUtil.strEq(syAlarm.alarmTypeCd, search.getTypeCd()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyAlarmDto.Item> query = baseQuery();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyAlarmDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syAlarm.count())
                .where(wheres2)
                .fetchOne();

        BasePage<SyAlarmDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SyAlarmDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syAlarm.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_alarm"))
                : null;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("alarmId", syAlarm.alarmId),
            QdslUtil.FieldDef.like("alarmMsg", syAlarm.alarmMsg),
            QdslUtil.FieldDef.like("alarmStatusCd", syAlarm.alarmStatusCd),
            QdslUtil.FieldDef.like("alarmTitle", syAlarm.alarmTitle),
            QdslUtil.FieldDef.like("alarmTypeCd", syAlarm.alarmTypeCd),
            QdslUtil.FieldDef.like("channelCd", syAlarm.channelCd),
            QdslUtil.FieldDef.like("pathId", syAlarm.pathId),
            QdslUtil.FieldDef.like("targetId", syAlarm.targetId),
            QdslUtil.FieldDef.like("targetTypeCd", syAlarm.targetTypeCd),
            QdslUtil.FieldDef.like("templateId", syAlarm.templateId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("alarmId", syAlarm.alarmId,
                   "alarmTitle", syAlarm.alarmTitle,
                   "alarmSendDate", syAlarm.alarmSendDate),
        new OrderSpecifier<>(Order.DESC, syAlarm.regDate),
        new OrderSpecifier<>(Order.ASC, syAlarm.alarmId));
    }

    /* 알람 수정 */
    @Override
    public int updateSelective(SyAlarm entity) {
        if (entity.getAlarmId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syAlarm);
        boolean hasAny = false;

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

    /* AND t.reg_date >= :dateRangeStart 00:00:00 AND t.reg_date <= :dateRangeEnd 23:59:59.999999 */
    private void pathtreeAndDateRange(SyAlarmDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateRangeStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateRangeStart AS timestamp)\n");
            p.put("dateRangeStart", s.getDateRangeStart());
        }
        if (StringUtils.hasText(s.getDateRangeEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateRangeEnd   AS timestamp) + INTERVAL '23:59:59.999999'\n");
            p.put("dateRangeEnd", s.getDateRangeEnd());
        }
    }
}
