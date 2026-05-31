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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyPath;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPathRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyPath QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPathRepositoryImpl implements QSyPathRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyPathRepositoryImpl";
    private static final QSyPath a = QSyPath.syPath;

    /* baseSelColumnQuery */
    private JPAQuery<SyPathDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyPathDto.Item.class,
                        a.pathId, a.bizCd, a.parentPathId, a.pathLabel, a.sortOrd,
                        a.useYn, a.pathRemark,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a);
    }

    /* 키조회 */
    @Override
    public Optional<SyPathDto.Item> selectById(String pathId) {
        SyPathDto.Item dto = baseSelColumnQuery().where(a.pathId.eq(pathId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyPathDto.Item> selectList(SyPathDto.Request search) {
        JPAQuery<SyPathDto.Item> query = baseSelColumnQuery().where(
                baseAndBizCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        );
        // default order: sort_ord ASC, path_id ASC
        query.orderBy(buildOrder().toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public SyPathDto.PageResponse selectPageData(SyPathDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        JPAQuery<SyPathDto.Item> query = baseSelColumnQuery().where(
                baseAndBizCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        );
        query = query.orderBy(buildOrder().toArray(OrderSpecifier[]::new));
        List<SyPathDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndBizCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyPathDto.PageResponse res = new SyPathDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* bizCd 정확 일치 */
    private BooleanExpression baseAndBizCd(SyPathDto.Request search) {
        return search != null && StringUtils.hasText(search.getBizCd())
                ? a.bizCd.eq(search.getBizCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyPathDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyPathDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",bizCd,", a.bizCd, pattern);
        or = orLike(or, all, types, ",parentPathId,", a.parentPathId, pattern);
        or = orLike(or, all, types, ",pathId,", a.pathId, pattern);
        or = orLike(or, all, types, ",pathLabel,", a.pathLabel, pattern);
        or = orLike(or, all, types, ",pathRemark,", a.pathRemark, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder() {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        orders.add(new OrderSpecifier(Order.ASC, a.sortOrd));
        orders.add(new OrderSpecifier(Order.ASC, a.pathId));
        return orders;
    }

    /* 수정 */


    @Override
    public int updateSelective(SyPath entity) {
        if (entity.getPathId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getBizCd()        != null) { update.set(a.bizCd,        entity.getBizCd());        hasAny = true; }
        if (entity.getParentPathId() != null) { update.set(a.parentPathId, entity.getParentPathId()); hasAny = true; }
        if (entity.getPathLabel()    != null) { update.set(a.pathLabel,    entity.getPathLabel());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(a.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(a.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getPathRemark()   != null) { update.set(a.pathRemark,   entity.getPathRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.pathId.eq(entity.getPathId())).execute();
        return (int) affected;
    }
}
