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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyProp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyProp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPropRepositoryImpl implements QSyPropRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final QSyProp p = QSyProp.syProp;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 시스템 속성 키조회 */
    @Override
    public Optional<SyPropDto.Item> selectById(String propId) {
        SyPropDto.Item dto = baseQuery().where(p.propId.eq(propId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 시스템 속성 목록조회 */
    @Override
    public List<SyPropDto.Item> selectList(SyPropDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyPropDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andPropTypeCd(search),
                andSearchValue(search)
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

    /* 시스템 속성 페이지조회 */
    @Override
    public SyPropDto.PageResponse selectPageList(SyPropDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyPropDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andPropTypeCd(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyPropDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(p.count()).from(p).where(
                andSiteId(search),
                andPathId(search),
                andPropTypeCd(search),
                andSearchValue(search)
        ).fetchOne();

        SyPropDto.PageResponse res = new SyPropDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 시스템 속성 baseQuery */
    private JPAQuery<SyPropDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyPropDto.Item.class,
                        p.propId, p.siteId, p.pathId, p.propKey, p.propValue, p.propLabel,
                        p.propTypeCd, p.sortOrd, p.useYn, p.propRemark,
                        p.regBy, p.regDate, p.updBy, p.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(p)
                .leftJoin(ste).on(ste.siteId.eq(p.siteId));
    }

    /* 시스템 속성 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? p.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? p.pathId.in(syPathRepository.findTreePathIds(search.getPathId()))
                : null;
    }

    /* propTypeCd 정확 일치 */
    private BooleanExpression andPropTypeCd(SyPropDto.Request search) {
        return search != null && StringUtils.hasText(search.getPropTypeCd())
                ? p.propTypeCd.eq(search.getPropTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyPropDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",pathId,", p.pathId, pattern);
        or = orLike(or, all, types, ",propId,", p.propId, pattern);
        or = orLike(or, all, types, ",propKey,", p.propKey, pattern);
        or = orLike(or, all, types, ",propLabel,", p.propLabel, pattern);
        or = orLike(or, all, types, ",propRemark,", p.propRemark, pattern);
        or = orLike(or, all, types, ",propTypeCd,", p.propTypeCd, pattern);
        or = orLike(or, all, types, ",propValue,", p.propValue, pattern);
        or = orLike(or, all, types, ",siteId,", p.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", p.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyPropDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, p.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.propId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("propId".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.propId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, p.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, p.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.propId));
        }
        return orders;
    }

    /* 시스템 속성 수정 */
    @Override
    public int updateSelective(SyProp entity) {
        if (entity.getPropId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(p.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getPathId()     != null) { update.set(p.pathId,     entity.getPathId());     hasAny = true; }
        if (entity.getPropKey()    != null) { update.set(p.propKey,    entity.getPropKey());    hasAny = true; }
        if (entity.getPropValue()  != null) { update.set(p.propValue,  entity.getPropValue());  hasAny = true; }
        if (entity.getPropLabel()  != null) { update.set(p.propLabel,  entity.getPropLabel());  hasAny = true; }
        if (entity.getPropTypeCd() != null) { update.set(p.propTypeCd, entity.getPropTypeCd()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(p.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(p.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getPropRemark() != null) { update.set(p.propRemark, entity.getPropRemark()); hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(p.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(p.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(p.propId.eq(entity.getPropId())).execute();
        return (int) affected;
    }
}
