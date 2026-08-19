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
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample0;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample0Repository;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** ZzSample0 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample0RepositoryImpl implements QZzSample0Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample0RepositoryImpl";
    private static final QZzSample0 zzSample0 = QZzSample0.zzSample0;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (zz_sample0 는 다목적 샘플 테이블이라 sy_code 미등록.
     * 아래는 실제 값이 아니라 필드 용도를 보여주기 위한 예시 가상 코드)
     * USE_YN {Y: '사용', N: '미사용'}
     */
    private JPAQuery<ZzSample0Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample0Dto.Item.class,
                        zzSample0.sample0Id,     // 샘플0 ID (PK, YYMMDDhhmmss+rand4)
                        zzSample0.sampleName,    // 샘플 이름
                        zzSample0.sampleDesc,    // 샘플 설명
                        zzSample0.sampleValue,   // 샘플 값
                        zzSample0.sortOrd,       // 정렬 순서
                        zzSample0.useYn,         // 사용 여부 — USE_YN {Y: '사용', N: '미사용'}
                        zzSample0.regBy,         // 등록자
                        zzSample0.regDate,       // 등록일시
                        zzSample0.updBy,         // 수정자
                        zzSample0.updDate,       // 수정일시
                        zzSample0.col01,         // 범용 컬럼01
                        zzSample0.col02,         // 범용 컬럼02
                        zzSample0.col03,         // 범용 컬럼03
                        zzSample0.col04,         // 범용 컬럼04
                        zzSample0.col05,         // 범용 컬럼05
                        zzSample0.col06,         // 범용 컬럼06
                        zzSample0.col07,         // 범용 컬럼07
                        zzSample0.col08,         // 범용 컬럼08
                        zzSample0.col09          // 범용 컬럼09
                ))
                .from(zzSample0);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample0Dto.Item> selectById(String id) {
        ZzSample0Dto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample0.sample0Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample0Dto.Item> selectList(ZzSample0Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(zzSample0.sample0Id, search.getSample0Id()));
        whereList.add(QdslUtil.strEq(zzSample0.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<ZzSample0Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<ZzSample0Dto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<ZzSample0Dto.Item> selectPageData(ZzSample0Dto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(zzSample0.sample0Id, search.getSample0Id()));
        whereList.add(QdslUtil.strEq(zzSample0.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<ZzSample0Dto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<ZzSample0Dto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzSample0.count())
                .where(wheres)
                .fetchOne();

        BasePage<ZzSample0Dto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("col01", zzSample0.col01),
            QdslUtil.FieldDef.like("col02", zzSample0.col02),
            QdslUtil.FieldDef.like("col03", zzSample0.col03),
            QdslUtil.FieldDef.like("col04", zzSample0.col04),
            QdslUtil.FieldDef.like("col05", zzSample0.col05),
            QdslUtil.FieldDef.like("col06", zzSample0.col06),
            QdslUtil.FieldDef.like("col07", zzSample0.col07),
            QdslUtil.FieldDef.like("col08", zzSample0.col08),
            QdslUtil.FieldDef.like("col09", zzSample0.col09),
            QdslUtil.FieldDef.like("sample0Id", zzSample0.sample0Id),
            QdslUtil.FieldDef.like("sampleDesc", zzSample0.sampleDesc),
            QdslUtil.FieldDef.like("sampleName", zzSample0.sampleName),
            QdslUtil.FieldDef.like("sampleValue", zzSample0.sampleValue),
            QdslUtil.FieldDef.like("useYn", zzSample0.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("sample0Id", zzSample0.sample0Id,
                   "sampleName", zzSample0.sampleName,
                   "regDate", zzSample0.regDate,
                   "sortOrd", zzSample0.sortOrd),
        new OrderSpecifier<>(Order.DESC, zzSample0.regDate),
        new OrderSpecifier<>(Order.ASC, zzSample0.sample0Id));
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample0 entity) {
        if (entity.getSample0Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample0);
        boolean hasAny = false;

        if (entity.getSampleName()  != null) { update.set(zzSample0.sampleName,  entity.getSampleName());  hasAny = true; }
        if (entity.getSampleDesc()  != null) { update.set(zzSample0.sampleDesc,  entity.getSampleDesc());  hasAny = true; }
        if (entity.getSampleValue() != null) { update.set(zzSample0.sampleValue, entity.getSampleValue()); hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(zzSample0.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(zzSample0.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(zzSample0.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(zzSample0.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample0.sample0Id.eq(entity.getSample0Id())).execute();
        return (int) affected;
    }
}
