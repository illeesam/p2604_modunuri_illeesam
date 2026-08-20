package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** SyPath(경로 (업무별 트리)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPathRepositoryImpl implements QSyPathRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyPathRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyPath syPath = QSyPath.syPath;

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
                        syPath.updDate,         // 수정일시
                        syPath.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syPath)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syPath.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syPath.regBy)) // 등록자
                ;
    }

    /* 키조회 */
    @Override
    public Optional<SyPathDto.Item> selectById(String pathId) {
        SyPathDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syPath.pathId.eq(pathId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 목록조회 */
    @Override
    public List<SyPathDto.Item> selectList(SyPathDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syPath.bizCd, search.getBizCd()));
        whereList.add(QdslUtil.strEq(syPath.parentPathId, search.getParentPathId()));
        whereList.add(QdslUtil.strEq(syPath.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        JPAQuery<SyPathDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres);
        // default order: sort_ord ASC, path_id ASC
        query.orderBy(buildOrder().toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyPathDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<SyPathDto.Item> selectPageData(SyPathDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syPath.bizCd, search.getBizCd()));
        whereList.add(QdslUtil.strEq(syPath.parentPathId, search.getParentPathId()));
        whereList.add(QdslUtil.strEq(syPath.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyPathDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        List<SyPathDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(buildOrder().toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syPath.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyPathDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("bizCd", syPath.bizCd),
            QdslUtil.FieldDef.like("parentPathId", syPath.parentPathId),
            QdslUtil.FieldDef.like("pathId", syPath.pathId),
            QdslUtil.FieldDef.like("pathLabel", syPath.pathLabel),
            QdslUtil.FieldDef.like("pathRemark", syPath.pathRemark),
            QdslUtil.FieldDef.like("useYn", syPath.useYn)
        ));
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
        update.set(syPath.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syPath.pathId.eq(entity.getPathId())).execute();
        return (int) affected;
    }
}
