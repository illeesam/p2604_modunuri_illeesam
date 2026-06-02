package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpAreaPanelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QDpAreaPanelRepositoryImpl implements QDpAreaPanelRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpAreaPanelRepositoryImpl";
    private static final QDpAreaPanel dpAreaPanel = QDpAreaPanel.dpAreaPanel;

    /* 전시 영역-패널 매핑 baseSelColumnQuery */
    private JPAQuery<DpAreaPanelDto.Item> baseSelColumnQuery() {
        return queryFactory.select(Projections.bean(DpAreaPanelDto.Item.class,
                dpAreaPanel.areaPanelId, dpAreaPanel.areaId, dpAreaPanel.panelId, dpAreaPanel.panelSortOrd,
                dpAreaPanel.visibilityTargets, dpAreaPanel.dispYn, dpAreaPanel.dispStartDt, dpAreaPanel.dispEndDt,
                dpAreaPanel.dispEnv, dpAreaPanel.useYn,
                dpAreaPanel.regBy, dpAreaPanel.regDate, dpAreaPanel.updBy, dpAreaPanel.updDate
        )).from(dpAreaPanel);
    }

    /* 전시 영역-패널 매핑 키조회 */
    @Override
    public Optional<DpAreaPanelDto.Item> selectById(String areaPanelId) {
        return Optional.ofNullable(baseSelColumnQuery().where(dpAreaPanel.areaPanelId.eq(areaPanelId)).fetchOne());
    }

    /* 전시 영역-패널 매핑 목록조회 */
    @Override
    public List<DpAreaPanelDto.Item> selectList(DpAreaPanelDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaPanelDto.Item> query = baseSelColumnQuery().where(
                baseAndAreaIds(search),
                baseAndAreaId(search),
                baseAndAreaPanelId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 영역-패널 매핑 페이지조회 */
    @Override
    public DpAreaPanelDto.PageResponse selectPageData(DpAreaPanelDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpAreaPanelDto.Item> query = baseSelColumnQuery().where(
                baseAndAreaIds(search),
                baseAndAreaId(search),
                baseAndAreaPanelId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpAreaPanelDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(dpAreaPanel.count()).from(dpAreaPanel).where(
                baseAndAreaIds(search),
                baseAndAreaId(search),
                baseAndAreaPanelId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();
        DpAreaPanelDto.PageResponse res = new DpAreaPanelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 -- 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* areaIds (IN) */
    private BooleanExpression baseAndAreaIds(DpAreaPanelDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getAreaIds())
                ? dpAreaPanel.areaId.in(search.getAreaIds()) : null;
    }

    /* areaId 정확 일치 */
    private BooleanExpression baseAndAreaId(DpAreaPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getAreaId())
                ? dpAreaPanel.areaId.eq(search.getAreaId()) : null;
    }

    /* areaPanelId 정확 일치 */
    private BooleanExpression baseAndAreaPanelId(DpAreaPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getAreaPanelId())
                ? dpAreaPanel.areaPanelId.eq(search.getAreaPanelId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(DpAreaPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? dpAreaPanel.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(DpAreaPanelDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return dpAreaPanel.regDate.goe(start).and(dpAreaPanel.regDate.lt(endExcl));
            case "upd_date": return dpAreaPanel.updDate.goe(start).and(dpAreaPanel.updDate.lt(endExcl));
            default:         return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(DpAreaPanelDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",areaId,",            dpAreaPanel.areaId,            pattern);
        or = orLike(or, all, types, ",areaPanelId,",       dpAreaPanel.areaPanelId,       pattern);
        or = orLike(or, all, types, ",dispEnv,",           dpAreaPanel.dispEnv,           pattern);
        or = orLike(or, all, types, ",dispYn,",            dpAreaPanel.dispYn,            pattern);
        or = orLike(or, all, types, ",panelId,",           dpAreaPanel.panelId,           pattern);
        or = orLike(or, all, types, ",siteId,",            dpAreaPanel.siteId,            pattern);
        or = orLike(or, all, types, ",useYn,",             dpAreaPanel.useYn,             pattern);
        or = orLike(or, all, types, ",visibilityTargets,", dpAreaPanel.visibilityTargets, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpAreaPanelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, dpAreaPanel.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpAreaPanel.areaPanelId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("areaPanelId".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpAreaPanel.areaPanelId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpAreaPanel.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, dpAreaPanel.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpAreaPanel.areaPanelId));
        }
        return orders;
    }

    /* 전시 영역-패널 매핑 수정 */


    @Override
    public int updateSelective(DpAreaPanel entity) {
        if (entity.getAreaPanelId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpAreaPanel);
        boolean hasAny = false;
        if (entity.getAreaId()            != null) { update.set(dpAreaPanel.areaId,            entity.getAreaId());            hasAny = true; }
        if (entity.getPanelId()           != null) { update.set(dpAreaPanel.panelId,           entity.getPanelId());           hasAny = true; }
        if (entity.getPanelSortOrd()      != null) { update.set(dpAreaPanel.panelSortOrd,      entity.getPanelSortOrd());      hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(dpAreaPanel.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(dpAreaPanel.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDt()       != null) { update.set(dpAreaPanel.dispStartDt,       entity.getDispStartDt());       hasAny = true; }
        if (entity.getDispEndDt()         != null) { update.set(dpAreaPanel.dispEndDt,         entity.getDispEndDt());         hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(dpAreaPanel.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(dpAreaPanel.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(dpAreaPanel.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpAreaPanel.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpAreaPanel.areaPanelId.eq(entity.getAreaPanelId())).execute();
    }
}
