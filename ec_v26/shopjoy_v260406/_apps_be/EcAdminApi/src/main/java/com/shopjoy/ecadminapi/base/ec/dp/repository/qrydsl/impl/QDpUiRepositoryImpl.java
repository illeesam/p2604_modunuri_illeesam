package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpUi;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** DpUi QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QDpUiRepositoryImpl implements QDpUiRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpUiRepositoryImpl";
    private static final QDpUi u = QDpUi.dpUi;

    /* 전시 UI 키조회 */
    @Override
    public Optional<DpUiDto.Item> selectById(String uiId) {
        DpUiDto.Item dto = baseQuery()
                .where(u.uiId.eq(uiId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 전시 UI 목록조회 */
    @Override
    public List<DpUiDto.Item> selectList(DpUiDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andUiId(search),
                andDeviceTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 전시 UI 페이지조회 */
    @Override
    public DpUiDto.PageResponse selectPageList(DpUiDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<DpUiDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andUiId(search),
                andDeviceTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<DpUiDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(u.count()).from(u).where(
                andSiteId(search),
                andPathId(search),
                andUiId(search),
                andDeviceTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        DpUiDto.PageResponse res = new DpUiDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 UI baseQuery */
    private JPAQuery<DpUiDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(DpUiDto.Item.class,
                        u.uiId, u.siteId, u.uiCd, u.uiNm, u.uiDesc,
                        u.deviceTypeCd, u.pathId, u.sortOrd, u.useYn,
                        u.useStartDate, u.useEndDate,
                        u.regBy, u.regDate, u.updBy, u.updDate
                ))
                .from(u);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(DpUiDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? u.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(DpUiDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? u.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_ui"))
                : null;
    }

    /* uiId 정확 일치 */
    private BooleanExpression andUiId(DpUiDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiId())
                ? u.uiId.eq(search.getUiId()) : null;
    }

    /* deviceTypeCd 정확 일치 */
    private BooleanExpression andDeviceTypeCd(DpUiDto.Request search) {
        return search != null && StringUtils.hasText(search.getDeviceTypeCd())
                ? u.deviceTypeCd.eq(search.getDeviceTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(DpUiDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return u.regDate.goe(start).and(u.regDate.lt(endExcl));
            case "upd_date": return u.updDate.goe(start).and(u.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(DpUiDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",deviceTypeCd,", u.deviceTypeCd, pattern);
        or = orLike(or, all, types, ",pathId,", u.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", u.siteId, pattern);
        or = orLike(or, all, types, ",uiCd,", u.uiCd, pattern);
        or = orLike(or, all, types, ",uiDesc,", u.uiDesc, pattern);
        or = orLike(or, all, types, ",uiId,", u.uiId, pattern);
        or = orLike(or, all, types, ",uiNm,", u.uiNm, pattern);
        or = orLike(or, all, types, ",useYn,", u.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpUiDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, u.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.uiId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("uiId".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.uiId));
                } else if ("uiNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.uiNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, u.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, u.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.uiId));
        }
        return orders;
    }

    /* 전시 UI 수정 */
    @Override
    public int updateSelective(DpUi entity) {
        if (entity.getUiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(u.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getUiCd()          != null) { update.set(u.uiCd,          entity.getUiCd());          hasAny = true; }
        if (entity.getUiNm()          != null) { update.set(u.uiNm,          entity.getUiNm());          hasAny = true; }
        if (entity.getUiDesc()        != null) { update.set(u.uiDesc,        entity.getUiDesc());        hasAny = true; }
        if (entity.getDeviceTypeCd()  != null) { update.set(u.deviceTypeCd,  entity.getDeviceTypeCd());  hasAny = true; }
        if (entity.getPathId()        != null) { update.set(u.pathId,        entity.getPathId());        hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(u.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(u.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUseStartDate()  != null) { update.set(u.useStartDate,  entity.getUseStartDate());  hasAny = true; }
        if (entity.getUseEndDate()    != null) { update.set(u.useEndDate,    entity.getUseEndDate());    hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(u.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(u.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(u.uiId.eq(entity.getUiId())).execute();
        return (int) affected;
    }
}
