package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam2;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam2;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam2Repository;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** ZzExam2 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam2RepositoryImpl implements QZzExam2Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzExam2RepositoryImpl";
    private static final QZzExam2 zzExam2 = QZzExam2.zzExam2;

    /* zz_exam2 baseSelColumnQuery — 코드성 필드 없음(범용 컬럼만 보유한 연습용 샘플 테이블) */
    private JPAQuery<ZzExam2Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam2Dto.Item.class,
                        zzExam2.exam1Id,    // 연관 exam1 ID (복합PK, FK)
                        zzExam2.exam2Id,    // exam2 ID (복합PK)
                        zzExam2.col21,      // 범용 컬럼21
                        zzExam2.col22,      // 범용 컬럼22
                        zzExam2.col23,      // 범용 컬럼23
                        zzExam2.col24,      // 범용 컬럼24
                        zzExam2.col25,      // 범용 컬럼25
                        zzExam2.regBy,      // 등록자
                        zzExam2.regDate,    // 등록일시
                        zzExam2.updBy,      // 수정자
                        zzExam2.updDate     // 수정일시
                ))
                .from(zzExam2);
    }

    /* zz_exam2 키조회 */
    @Override
    public Optional<ZzExam2Dto.Item> selectById(String exam1Id, String exam2Id) {
        ZzExam2Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzExam2.exam1Id.eq(exam1Id).and(zzExam2.exam2Id.eq(exam2Id)))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam2 목록조회 */
    @Override
    public List<ZzExam2Dto.Item> selectList(ZzExam2Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<ZzExam2Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(zzExam2.exam1Id, search.getExam1Ids()),
                QdslUtil.strEq(zzExam2.exam1Id, search.getExam1Id()),
                QdslUtil.strEq(zzExam2.exam2Id, search.getExam2Id()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* zz_exam2 페이지조회 */
    @Override
    public BasePage<ZzExam2Dto.Item> selectPageData(ZzExam2Dto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(zzExam2.exam1Id, search.getExam1Ids()),
                QdslUtil.strEq(zzExam2.exam1Id, search.getExam1Id()),
                QdslUtil.strEq(zzExam2.exam2Id, search.getExam2Id()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzExam2Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzExam2Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzExam2.count())
                .where(wheres)
                .fetchOne();

        BasePage<ZzExam2Dto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col21,col22" */

    /* zz_exam2 buildOrder */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("col21", zzExam2.col21),
            QdslUtil.FieldDef.like("col22", zzExam2.col22),
            QdslUtil.FieldDef.like("col23", zzExam2.col23),
            QdslUtil.FieldDef.like("col24", zzExam2.col24),
            QdslUtil.FieldDef.like("col25", zzExam2.col25),
            QdslUtil.FieldDef.like("exam1Id", zzExam2.exam1Id),
            QdslUtil.FieldDef.like("exam2Id", zzExam2.exam2Id)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("exam1Id", zzExam2.exam1Id,
                   "exam2Id", zzExam2.exam2Id),
        new OrderSpecifier<>(Order.DESC, zzExam2.regDate),
        new OrderSpecifier<>(Order.ASC, zzExam2.exam1Id));
    }

    /* zz_exam2 수정 */
    @Override
    public int updateSelective(ZzExam2 entity) {
        if (entity.getExam1Id() == null || entity.getExam2Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzExam2);
        boolean hasAny = false;

        if (entity.getCol21() != null) { update.set(zzExam2.col21, entity.getCol21()); hasAny = true; }
        if (entity.getCol22() != null) { update.set(zzExam2.col22, entity.getCol22()); hasAny = true; }
        if (entity.getCol23() != null) { update.set(zzExam2.col23, entity.getCol23()); hasAny = true; }
        if (entity.getCol24() != null) { update.set(zzExam2.col24, entity.getCol24()); hasAny = true; }
        if (entity.getCol25() != null) { update.set(zzExam2.col25, entity.getCol25()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update
                .where(zzExam2.exam1Id.eq(entity.getExam1Id()).and(zzExam2.exam2Id.eq(entity.getExam2Id())))
                .execute();
        return (int) affected;
    }
}
