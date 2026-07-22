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

import java.time.LocalDateTime;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyPath QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPathRepositoryImpl implements QSyPathRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyPathRepositoryImpl";
    private static final QSyPath syPath = QSyPath.syPath;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("bizCd", syPath.bizCd),
        Map.entry("parentPathId", syPath.parentPathId),
        Map.entry("pathId", syPath.pathId),
        Map.entry("pathLabel", syPath.pathLabel),
        Map.entry("pathRemark", syPath.pathRemark),
        Map.entry("siteId", syPath.siteId),
        Map.entry("useYn", syPath.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN {Y: '사용', N: '미사용'}
     * BIZ_CD (sy_code 미등록, 참조 테이블명 자유 문자열) 예: sy_brand, sy_code_grp, sy_prop, sy_batch, sy_alarm 등
     */
    private JPAQuery<SyPathDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyPathDto.Item.class,
                        syPath.pathId,         // 경로ID (PK, auto)
                        syPath.bizCd,          // 업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)
                        syPath.parentPathId,   // 부모 경로ID (sy_path.path_id, 루트는 NULL)
                        syPath.pathLabel,      // 경로 라벨 (한글 표시명)
                        syPath.sortOrd,        // 동일 부모 내 정렬순서
                        syPath.useYn,          // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syPath.pathRemark,     // 비고
                        syPath.regBy,          // 등록자
                        syPath.regDate,        // 등록일시
                        syPath.updBy,          // 수정자
                        syPath.updDate         // 수정일시
                ))
                .from(syPath);
    }

    /* 키조회 */
    @Override
    public Optional<SyPathDto.Item> selectById(String pathId) {
        SyPathDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syPath.pathId.eq(pathId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyPathDto.Item> selectList(SyPathDto.Request search) {
        JPAQuery<SyPathDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(syPath.bizCd, search.getBizCd()),
                    QdslUtil.strEq(syPath.parentPathId, search.getParentPathId()),
                    QdslUtil.strEq(syPath.useYn, search.getUseYn()),
                    andSearchValueLike(search)
                );
        // default order: sort_ord ASC, path_id ASC
        query.orderBy(buildOrder().toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public SyPathDto.PageResponse selectPageData(SyPathDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        BooleanExpression[] wheres = {
                QdslUtil.strEq(syPath.bizCd, search.getBizCd()),
                QdslUtil.strEq(syPath.parentPathId, search.getParentPathId()),
                QdslUtil.strEq(syPath.useYn, search.getUseYn()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyPathDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyPathDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(buildOrder().toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syPath.count())
                .where(wheres)
                .fetchOne();

        SyPathDto.PageResponse res = new SyPathDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyPathDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder() {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        orders.add(new OrderSpecifier(Order.ASC, syPath.sortOrd));
        orders.add(new OrderSpecifier(Order.ASC, syPath.pathId));
        return orders;
    }

    /* 수정 */

    @Override
    public int updateSelective(SyPath entity) {
        if (entity.getPathId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syPath);
        boolean hasAny = false;

        if (entity.getBizCd()        != null) { update.set(syPath.bizCd,        entity.getBizCd());        hasAny = true; }
        if (entity.getParentPathId() != null) { update.set(syPath.parentPathId, entity.getParentPathId()); hasAny = true; }
        if (entity.getPathLabel()    != null) { update.set(syPath.pathLabel,    entity.getPathLabel());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syPath.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syPath.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getPathRemark()   != null) { update.set(syPath.pathRemark,   entity.getPathRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syPath.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syPath.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syPath.pathId.eq(entity.getPathId())).execute();
        return (int) affected;
    }
}
