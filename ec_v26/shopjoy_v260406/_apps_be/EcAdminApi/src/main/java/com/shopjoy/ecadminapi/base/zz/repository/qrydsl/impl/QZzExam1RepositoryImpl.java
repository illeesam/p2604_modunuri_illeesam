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
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam1;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam1;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam1Repository;
import lombok.RequiredArgsConstructor;

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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(zzExam1.exam1Id, search.getExam1Ids()));
        wheres.add(QdslUtil.strEq(zzExam1.exam1Id, search.getExam1Id()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<ZzExam1Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres2)
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

    /* zz_exam1 페이지조회 */
    @Override
    public BasePage<ZzExam1Dto.Item> selectPageData(ZzExam1Dto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(zzExam1.exam1Id, search.getExam1Ids()));
        wheres.add(QdslUtil.strEq(zzExam1.exam1Id, search.getExam1Id()));
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<ZzExam1Dto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<ZzExam1Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzExam1.count())
                .where(wheres2)
                .fetchOne();

        BasePage<ZzExam1Dto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col11,col12" */

    /* zz_exam1 buildOrder */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("col11", zzExam1.col11),
            QdslUtil.FieldDef.like("col12", zzExam1.col12),
            QdslUtil.FieldDef.like("col13", zzExam1.col13),
            QdslUtil.FieldDef.like("col14", zzExam1.col14),
            QdslUtil.FieldDef.like("col15", zzExam1.col15),
            QdslUtil.FieldDef.like("exam1Id", zzExam1.exam1Id)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("exam1Id", zzExam1.exam1Id),
        new OrderSpecifier<>(Order.DESC, zzExam1.regDate),
        new OrderSpecifier<>(Order.ASC, zzExam1.exam1Id));
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
