package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmPath;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPathRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** CmPath QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmPathRepositoryImpl implements QCmPathRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmPathRepositoryImpl";
    private static final QCmPath cmPath = QCmPath.cmPath;    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값
     * USE_YN  {Y: '사용', N: '미사용'} — sy_code 미등록, use_yn 전역 공통 규약
     */
    private JPAQuery<CmPathDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmPathDto.Item.class,
                        cmPath.bizCd,         // 업무코드 (PK, 참조 테이블명, 예: sy_brand / sy_code_grp / ec_prop)
                        cmPath.parentPathId,  // 부모 경로ID (sy_path., 루트는 NULL)
                        cmPath.pathLabel,     // 경로 라벨 (한글 표시명)
                        cmPath.sortOrd,       // 동일 부모 내 정렬순서
                        cmPath.useYn,         // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        cmPath.pathRemark,    // 비고
                        cmPath.regBy,         // 등록자
                        cmPath.regDate,       // 등록일시
                        cmPath.updBy,         // 수정자
                        cmPath.updDate        // 수정일시
                ))
                .from(cmPath);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmPathDto.Item> selectById(String bizCd) {
        CmPathDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmPath.bizCd.eq(bizCd))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmPathDto.Item> selectList(CmPathDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmPath.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(cmPath.bizCd, search.getBizCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmPath.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmPath.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmPathDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public BasePage<CmPathDto.Item> selectPageData(CmPathDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmPath.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(cmPath.bizCd, search.getBizCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmPath.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmPath.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmPathDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmPathDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmPath.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmPathDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("bizCd", cmPath.bizCd),
            QdslUtil.FieldDef.like("pathLabel", cmPath.pathLabel),
            QdslUtil.FieldDef.like("pathRemark", cmPath.pathRemark),
            QdslUtil.FieldDef.like("useYn", cmPath.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("bizCd", cmPath.bizCd,
                   "regDate", cmPath.regDate,
                   "sortOrd", cmPath.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmPath.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmPath.regDate),
        new OrderSpecifier<>(Order.ASC, cmPath.bizCd));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmPath entity) {
        if (entity.getBizCd() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmPath);
        boolean hasAny = false;

        if (entity.getParentPathId() != null) { update.set(cmPath.parentPathId, entity.getParentPathId()); hasAny = true; }
        if (entity.getPathLabel()    != null) { update.set(cmPath.pathLabel,    entity.getPathLabel());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(cmPath.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(cmPath.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getPathRemark()   != null) { update.set(cmPath.pathRemark,   entity.getPathRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(cmPath.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(cmPath.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmPath.bizCd.eq(entity.getBizCd())).execute();
        return (int) affected;
    }
}
