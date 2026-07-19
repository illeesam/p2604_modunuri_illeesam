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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyI18nRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyI18n QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyI18nRepositoryImpl implements QSyI18nRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyI18nRepositoryImpl";
    private static final QSyI18n syI18n = QSyI18n.syI18n;
    private static final QSySite sySite = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 다국어 baseSelColumnQuery */
    private JPAQuery<SyI18nDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyI18nDto.Item.class,
                        syI18n.i18nId, syI18n.siteId, syI18n.i18nKey, syI18n.i18nDesc, syI18n.i18nScopeCd,
                        syI18n.i18nCategory, syI18n.sortOrd, syI18n.useYn,
                        syI18n.regBy, syI18n.regDate, syI18n.updBy, syI18n.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syI18n)
                .leftJoin(sySite).on(sySite.siteId.eq(syI18n.siteId));
    }

    /* 다국어 키조회 */
    @Override
    public Optional<SyI18nDto.Item> selectById(String i18nId) {
        SyI18nDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syI18n.i18nId.eq(i18nId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 다국어 목록조회 */
    @Override
    public List<SyI18nDto.Item> selectList(SyI18nDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyI18nDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andI18nIdEq(search),
                    andI18nScopeCdEq(search),
                    andUseYnEq(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 다국어 페이지조회 */
    @Override
    public SyI18nDto.PageResponse selectPageData(SyI18nDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andI18nIdEq(search),
                andI18nScopeCdEq(search),
                andUseYnEq(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyI18nDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyI18nDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syI18n.count())
                .where(wheres)
                .fetchOne();

        SyI18nDto.PageResponse res = new SyI18nDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 다국어 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(SyI18nDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syI18n.siteId.eq(search.getSiteId()) : null;
    }

    /* i18nId 정확 일치 */
    private BooleanExpression andI18nIdEq(SyI18nDto.Request search) {
        return search != null && StringUtils.hasText(search.getI18nId())
                ? syI18n.i18nId.eq(search.getI18nId()) : null;
    }

    /* i18nScopeCd 정확 일치 (범위 select) */
    private BooleanExpression andI18nScopeCdEq(SyI18nDto.Request search) {
        return search != null && StringUtils.hasText(search.getI18nScopeCd())
                ? syI18n.i18nScopeCd.eq(search.getI18nScopeCd()) : null;
    }

    /* useYn 정확 일치 (사용여부 select) */
    private BooleanExpression andUseYnEq(SyI18nDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? syI18n.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(SyI18nDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",i18nCategory,", syI18n.i18nCategory, pattern);
        or = orLike(or, all, types, ",i18nDesc,", syI18n.i18nDesc, pattern);
        or = orLike(or, all, types, ",i18nId,", syI18n.i18nId, pattern);
        or = orLike(or, all, types, ",i18nKey,", syI18n.i18nKey, pattern);
        or = orLike(or, all, types, ",i18nScopeCd,", syI18n.i18nScopeCd, pattern);
        or = orLike(or, all, types, ",siteId,", syI18n.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", syI18n.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyI18nDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syI18n.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syI18n.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syI18n.i18nId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("i18nId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syI18n.i18nId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syI18n.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syI18n.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syI18n.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syI18n.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syI18n.i18nId));
        }
        return orders;
    }

    /* 다국어 수정 */


    @Override
    public int updateSelective(SyI18n entity) {
        if (entity.getI18nId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syI18n);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(syI18n.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getI18nKey()      != null) { update.set(syI18n.i18nKey,      entity.getI18nKey());      hasAny = true; }
        if (entity.getI18nDesc()     != null) { update.set(syI18n.i18nDesc,     entity.getI18nDesc());     hasAny = true; }
        if (entity.getI18nScopeCd()  != null) { update.set(syI18n.i18nScopeCd,  entity.getI18nScopeCd());  hasAny = true; }
        if (entity.getI18nCategory() != null) { update.set(syI18n.i18nCategory, entity.getI18nCategory()); hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syI18n.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syI18n.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syI18n.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syI18n.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syI18n.i18nId.eq(entity.getI18nId())).execute();
        return (int) affected;
    }
}
