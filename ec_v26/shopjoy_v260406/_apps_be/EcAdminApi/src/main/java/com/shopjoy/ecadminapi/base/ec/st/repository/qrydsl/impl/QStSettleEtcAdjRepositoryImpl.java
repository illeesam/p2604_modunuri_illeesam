package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleEtcAdjRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettleEtcAdj QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleEtcAdjRepositoryImpl implements QStSettleEtcAdjRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleEtcAdjRepositoryImpl";
    private static final QStSettleEtcAdj stSettleEtcAdj     = QStSettleEtcAdj.stSettleEtcAdj;
    private static final QSySite         sySite   = QSySite.sySite;
    private static final QVwSyCode         cdSeat = new QVwSyCode("cd_seat");
    private static final QVwSyCode         cdAd   = new QVwSyCode("cd_ad");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_ETC_ADJ_TYPE  {위약금, 인센티브, 세금조정, 기타} (코드값 자체가 한글 — Entity 주석상 SHIP/RETURN_SHIP/PENALTY/OTHER 와 값 표기가 다름)
     * ADJ_DIR              {ADD: '가산', SUB: '차감'} (Entity 주석상 ADD/DEDUCT 와 값 표기가 다름)
     */
    private JPAQuery<StSettleEtcAdjDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleEtcAdjDto.Item.class,
                        stSettleEtcAdj.settleEtcAdjId,       // 기타조정ID (PK)
                        stSettleEtcAdj.settleId,              // 정산ID (st_settle.settle_id)
                        stSettleEtcAdj.etcAdjTypeCd,          // 기타조정유형 — SETTLE_ETC_ADJ_TYPE {위약금, 인센티브, 세금조정, 기타}
                        stSettleEtcAdj.etcAdjDirCd,           // 가산/차감 — ADJ_DIR {ADD: '가산', SUB: '차감'}
                        stSettleEtcAdj.etcAdjAmt,             // 기타조정 금액
                        stSettleEtcAdj.etcAdjReason,          // 사유
                        stSettleEtcAdj.settleEtcAdjMemo,      // 메모
                        stSettleEtcAdj.regBy,                 // 등록자
                        stSettleEtcAdj.regDate,               // 등록일시
                        stSettleEtcAdj.updBy,                 // 수정자
                        stSettleEtcAdj.updDate,               // 수정일시
                        cdSeat.codeLabel.as("etcAdjTypeCdNm"),        // 기타조정유형명 (sy_code 조인)
                        cdAd.codeLabel.as("etcAdjDirCdNm")            // 가산/차감명 (sy_code 조인)
                ))
                .from(stSettleEtcAdj)
                .leftJoin(cdSeat).on(cdSeat.codeGrp.eq("ETC_ADJ_TYPE_CD").and(cdSeat.codeValue.eq(stSettleEtcAdj.etcAdjTypeCd)))
                .leftJoin(cdAd).on(cdAd.codeGrp.eq("ETC_ADJ_DIR_CD").and(cdAd.codeValue.eq(stSettleEtcAdj.etcAdjDirCd)));
    }

    /* 정산 기타 조정 키조회 */
    @Override
    public Optional<StSettleEtcAdjDto.Item> selectById(String id) {
        StSettleEtcAdjDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleEtcAdj.settleEtcAdjId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 기타 조정 목록조회 */
    @Override
    public List<StSettleEtcAdjDto.Item> selectList(StSettleEtcAdjDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettleEtcAdj.settleEtcAdjId, search.getSettleEtcAdjId()));
        whereList.add(QdslUtil.strEq(stSettleEtcAdj.etcAdjTypeCd, search.getEtcAdjTypeCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleEtcAdj.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleEtcAdj.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<StSettleEtcAdjDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
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

    /* 정산 기타 조정 페이지조회 */
    @Override
    public BasePage<StSettleEtcAdjDto.Item> selectPageData(StSettleEtcAdjDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettleEtcAdj.settleEtcAdjId, search.getSettleEtcAdjId()));
        whereList.add(QdslUtil.strEq(stSettleEtcAdj.etcAdjTypeCd, search.getEtcAdjTypeCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleEtcAdj.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettleEtcAdj.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<StSettleEtcAdjDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<StSettleEtcAdjDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleEtcAdj.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleEtcAdjDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("etcAdjDirCd", stSettleEtcAdj.etcAdjDirCd),
            QdslUtil.FieldDef.like("etcAdjReason", stSettleEtcAdj.etcAdjReason),
            QdslUtil.FieldDef.like("etcAdjTypeCd", stSettleEtcAdj.etcAdjTypeCd),
            QdslUtil.FieldDef.like("settleEtcAdjId", stSettleEtcAdj.settleEtcAdjId),
            QdslUtil.FieldDef.like("settleEtcAdjMemo", stSettleEtcAdj.settleEtcAdjMemo),
            QdslUtil.FieldDef.like("settleId", stSettleEtcAdj.settleId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("settleEtcAdjId", stSettleEtcAdj.settleEtcAdjId,
                   "regDate", stSettleEtcAdj.regDate),
        new OrderSpecifier<>(Order.DESC, stSettleEtcAdj.regDate),
        new OrderSpecifier<>(Order.ASC, stSettleEtcAdj.settleEtcAdjId));
    }

    /* 정산 기타 조정 수정 */
    @Override
    public int updateSelective(StSettleEtcAdj entity) {
        if (entity.getSettleEtcAdjId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleEtcAdj);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettleEtcAdj.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getEtcAdjTypeCd()     != null) { update.set(stSettleEtcAdj.etcAdjTypeCd,     entity.getEtcAdjTypeCd());     hasAny = true; }
        if (entity.getEtcAdjDirCd()      != null) { update.set(stSettleEtcAdj.etcAdjDirCd,      entity.getEtcAdjDirCd());      hasAny = true; }
        if (entity.getEtcAdjAmt()        != null) { update.set(stSettleEtcAdj.etcAdjAmt,        entity.getEtcAdjAmt());        hasAny = true; }
        if (entity.getEtcAdjReason()     != null) { update.set(stSettleEtcAdj.etcAdjReason,     entity.getEtcAdjReason());     hasAny = true; }
        if (entity.getSettleEtcAdjMemo() != null) { update.set(stSettleEtcAdj.settleEtcAdjMemo, entity.getSettleEtcAdjMemo()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(stSettleEtcAdj.updBy,            entity.getUpdBy());            hasAny = true; }
        update.set(stSettleEtcAdj.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleEtcAdj.settleEtcAdjId.eq(entity.getSettleEtcAdjId())).execute();
        return (int) affected;
    }
}
