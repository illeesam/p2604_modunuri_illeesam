package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam1;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam1;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam1Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** ZzExam1 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam1RepositoryImpl implements QZzExam1Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzExam1RepositoryImpl";
    private static final QZzExam1 zzExam1 = QZzExam1.zzExam1;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("col11", zzExam1.col11),
        Map.entry("col12", zzExam1.col12),
        Map.entry("col13", zzExam1.col13),
        Map.entry("col14", zzExam1.col14),
        Map.entry("col15", zzExam1.col15),
        Map.entry("exam1Id", zzExam1.exam1Id)
    );

    /* zz_exam1 baseSelColumnQuery — 코드성 필드 없음(범용 컬럼만 보유한 연습용 샘플 테이블) */
    private JPAQuery<ZzExam1Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam1Dto.Item.class,
                        zzExam1.exam1Id,    // exam1 ID (PK)
                        zzExam1.col11,      // 범용 컬럼11
                        zzExam1.col12,      // 범용 컬럼12
                        zzExam1.col13,      // 범용 컬럼13
                        zzExam1.col14,      // 범용 컬럼14
                        zzExam1.col15,      // 범용 컬럼15
                        zzExam1.regBy,      // 등록자
                        zzExam1.regDate,    // 등록일시
                        zzExam1.updBy,      // 수정자
                        zzExam1.updDate     // 수정일시
                ))
                .from(zzExam1);
    }

    /* zz_exam1 키조회 */
    @Override
    public Optional<ZzExam1Dto.Item> selectById(String exam1Id) {
        ZzExam1Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzExam1.exam1Id.eq(exam1Id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam1 목록조회 */
    @Override
    public List<ZzExam1Dto.Item> selectList(ZzExam1Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam1Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(zzExam1.exam1Id, search.getExam1Ids()),
                QdslUtil.strEq(zzExam1.exam1Id, search.getExam1Id()),
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

    /* zz_exam1 페이지조회 */
    @Override
    public ZzExam1Dto.PageResponse selectPageData(ZzExam1Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(zzExam1.exam1Id, search.getExam1Ids()),
                QdslUtil.strEq(zzExam1.exam1Id, search.getExam1Id()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzExam1Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzExam1Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzExam1.count())
                .where(wheres)
                .fetchOne();

        ZzExam1Dto.PageResponse res = new ZzExam1Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col11,col12" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(ZzExam1Dto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /* zz_exam1 buildOrder */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzExam1Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, zzExam1.exam1Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("exam1Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzExam1.exam1Id));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzExam1.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzExam1.exam1Id));
        }
        return orders;
    }

    /* zz_exam1 수정 */
    @Override
    public int updateSelective(ZzExam1 entity) {
        if (entity.getExam1Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzExam1);
        boolean hasAny = false;

        if (entity.getCol11() != null) { update.set(zzExam1.col11, entity.getCol11()); hasAny = true; }
        if (entity.getCol12() != null) { update.set(zzExam1.col12, entity.getCol12()); hasAny = true; }
        if (entity.getCol13() != null) { update.set(zzExam1.col13, entity.getCol13()); hasAny = true; }
        if (entity.getCol14() != null) { update.set(zzExam1.col14, entity.getCol14()); hasAny = true; }
        if (entity.getCol15() != null) { update.set(zzExam1.col15, entity.getCol15()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzExam1.exam1Id.eq(entity.getExam1Id())).execute();
        return (int) affected;
    }
}
