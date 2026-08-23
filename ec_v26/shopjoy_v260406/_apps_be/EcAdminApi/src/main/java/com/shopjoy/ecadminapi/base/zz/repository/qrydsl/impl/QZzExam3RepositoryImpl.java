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
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam3Repository;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

/** ZzExam3 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam3RepositoryImpl implements QZzExam3Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzExam3RepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QZzExam3 zzExam3 = QZzExam3.zzExam3;

    /* zz_exam3 baseSelColumnQuery — 코드성 필드 없음(범용 컬럼만 보유한 연습용 샘플 테이블) */
    private JPAQuery<ZzExam3Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam3Dto.Item.class,
                        zzExam3.exam1Id,    // 연관 exam1 ID (복합PK, FK)
                        zzExam3.exam2Id,    // 연관 exam2 ID (복합PK, FK)
                        zzExam3.exam3Id,    // exam3 ID (복합PK)
                        zzExam3.col31,      // 범용 컬럼31
                        zzExam3.col32,      // 범용 컬럼32
                        zzExam3.col33,      // 범용 컬럼33
                        zzExam3.col34,      // 범용 컬럼34
                        zzExam3.col35,      // 범용 컬럼35
                        zzExam3.regBy,      // 등록자
                        zzExam3.regDate,    // 등록일시
                        zzExam3.updBy,      // 수정자
                        zzExam3.updDate,     // 수정일시
                        zzExam3.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(zzExam3)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(zzExam3.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(zzExam3.regBy)) // 등록자
                ;
    }

    /* zz_exam3 키조회 */
    @Override
    public Optional<ZzExam3Dto.Item> selectById(String exam1Id, String exam2Id, String exam3Id) {
        ZzExam3Dto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzExam3.exam1Id.eq(exam1Id)
                        .and(zzExam3.exam2Id.eq(exam2Id))
                        .and(zzExam3.exam3Id.eq(exam3Id)))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* zz_exam3 목록조회 */
    @Override
    public List<ZzExam3Dto.Item> selectList(ZzExam3Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(zzExam3.exam1Id, search.getExam1Ids())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(zzExam3.exam1Id, search.getExam1Id())); // PK 정확일치
        whereList.add(QdslUtil.strEq(zzExam3.exam2Id, search.getExam2Id())); // PK 정확일치
        whereList.add(QdslUtil.strEq(zzExam3.exam3Id, search.getExam3Id())); // PK 정확일치
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<ZzExam3Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<ZzExam3Dto.Item> list = query.fetch();
        return list;
    }

    /* zz_exam3 페이지조회 */
    @Override
    public BasePage<ZzExam3Dto.Item> selectPageData(ZzExam3Dto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(zzExam3.exam1Id, search.getExam1Ids())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(zzExam3.exam1Id, search.getExam1Id())); // PK 정확일치
        whereList.add(QdslUtil.strEq(zzExam3.exam2Id, search.getExam2Id())); // PK 정확일치
        whereList.add(QdslUtil.strEq(zzExam3.exam3Id, search.getExam3Id())); // PK 정확일치
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<ZzExam3Dto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<ZzExam3Dto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzExam3.count())
                .where(wheres)
                .fetchOne();

        BasePage<ZzExam3Dto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "col31,col32,col33,col34,col35" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("col31", zzExam3.col31), // 예제 범용 컬럼31 검색값
            QdslUtil.FieldDef.like("col32", zzExam3.col32), // 예제 범용 컬럼32 검색값
            QdslUtil.FieldDef.like("col33", zzExam3.col33), // 예제 범용 컬럼33 검색값
            QdslUtil.FieldDef.like("col34", zzExam3.col34), // 예제 범용 컬럼34 검색값
            QdslUtil.FieldDef.like("col35", zzExam3.col35), // 예제 범용 컬럼35 검색값
            QdslUtil.FieldDef.like("exam1Id", zzExam3.exam1Id), // PK 정확일치
            QdslUtil.FieldDef.like("exam2Id", zzExam3.exam2Id), // PK 정확일치
            QdslUtil.FieldDef.like("exam3Id", zzExam3.exam3Id) // PK 정확일치
        ));
    }

    /* zz_exam3 buildOrder */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("exam1Id", zzExam3.exam1Id,
                   "exam2Id", zzExam3.exam2Id,
                   "exam3Id", zzExam3.exam3Id),
        new OrderSpecifier<>(Order.DESC, zzExam3.regDate),
        new OrderSpecifier<>(Order.ASC, zzExam3.exam1Id));
    }

    /* zz_exam3 수정 */
    @Override
    public int updateSelective(ZzExam3 entity) {
        if (entity.getExam1Id() == null || entity.getExam2Id() == null || entity.getExam3Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzExam3);
        boolean hasAny = false;

        if (entity.getCol31() != null) { update.set(zzExam3.col31, entity.getCol31()); hasAny = true; }
        if (entity.getCol32() != null) { update.set(zzExam3.col32, entity.getCol32()); hasAny = true; }
        if (entity.getCol33() != null) { update.set(zzExam3.col33, entity.getCol33()); hasAny = true; }
        if (entity.getCol34() != null) { update.set(zzExam3.col34, entity.getCol34()); hasAny = true; }
        if (entity.getCol35() != null) { update.set(zzExam3.col35, entity.getCol35()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update
                .where(zzExam3.exam1Id.eq(entity.getExam1Id())
                        .and(zzExam3.exam2Id.eq(entity.getExam2Id()))
                        .and(zzExam3.exam3Id.eq(entity.getExam3Id())))
                .execute();
        return (int) affected;
    }
}
