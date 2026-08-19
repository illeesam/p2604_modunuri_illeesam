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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleAdjRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettleAdj QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleAdjRepositoryImpl implements QStSettleAdjRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleAdjRepositoryImpl";
    private static final QStSettleAdj stSettleAdj    = QStSettleAdj.stSettleAdj;
    private static final QSySite     sySite  = QSySite.sySite;
    private static final QVwSyCode     cdSat = new QVwSyCode("cd_sat");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_ADJ_TYPE    {PENALTY: '패널티', BONUS: '보너스', ERROR_FIX: '오류수정', OTHER: '기타'}
     * SETTLE_ADJ_STATUS  {대기: '대기', 승인: '승인', 반려: '반려'} — aprvStatusCd (sy_code 조인 미사용, 코드값 자체가 한글)
     */
    private JPAQuery<StSettleAdjDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleAdjDto.Item.class,
                        stSettleAdj.settleAdjId,          // 정산조정ID (PK)
                        stSettleAdj.settleId,              // 정산ID (st_settle.settle_id)
                        stSettleAdj.adjTypeCd,              // 조정유형 — SETTLE_ADJ_TYPE {PENALTY: '패널티', BONUS: '보너스', ERROR_FIX: '오류수정', OTHER: '기타'}
                        stSettleAdj.adjAmt,                 // 조정금액 (양수, 유형에 따라 가산/차감)
                        stSettleAdj.adjReason,              // 조정 사유
                        stSettleAdj.settleAdjMemo,          // 메모
                        stSettleAdj.aprvStatusCd,           // 승인상태 — SETTLE_ADJ_STATUS {대기, 승인, 반려}
                        stSettleAdj.regBy,                  // 등록자
                        stSettleAdj.regDate,                // 등록일시
                        stSettleAdj.updBy,                  // 수정자
                        stSettleAdj.updDate,                // 수정일시
                        cdSat.codeLabel.as("adjTypeCdNm")           // 조정유형명 (sy_code 조인)
                ))
                .from(stSettleAdj)
                .leftJoin(cdSat).on(cdSat.codeGrp.eq("ADJ_TYPE_CD").and(cdSat.codeValue.eq(stSettleAdj.adjTypeCd)));
    }

    /* 정산 조정 키조회 */
    @Override
    public Optional<StSettleAdjDto.Item> selectById(String id) {
        StSettleAdjDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleAdj.settleAdjId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 조정 목록조회 */
    @Override
    public List<StSettleAdjDto.Item> selectList(StSettleAdjDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(stSettleAdj.settleAdjId, search.getSettleAdjId()));
        wheres.add(QdslUtil.strEq(stSettleAdj.adjTypeCd, search.getAdjTypeCd()));
        wheres.add(QdslUtil.strEq(stSettleAdj.aprvStatusCd, search.getAprvStatusCd()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(stSettleAdj.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(stSettleAdj.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<StSettleAdjDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
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

    /* 정산 조정 페이지조회 */
    @Override
    public BasePage<StSettleAdjDto.Item> selectPageData(StSettleAdjDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettleAdj.settleAdjId, search.getSettleAdjId()));
        whereList.add(QdslUtil.strEq(stSettleAdj.adjTypeCd, search.getAdjTypeCd()));
        whereList.add(QdslUtil.strEq(stSettleAdj.aprvStatusCd, search.getAprvStatusCd()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleAdj.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleAdj.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleAdjDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleAdjDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleAdj.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleAdjDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("adjReason", stSettleAdj.adjReason),
            QdslUtil.FieldDef.like("adjTypeCd", stSettleAdj.adjTypeCd),
            QdslUtil.FieldDef.like("aprvStatusCd", stSettleAdj.aprvStatusCd),
            QdslUtil.FieldDef.like("settleAdjId", stSettleAdj.settleAdjId),
            QdslUtil.FieldDef.like("settleAdjMemo", stSettleAdj.settleAdjMemo),
            QdslUtil.FieldDef.like("settleId", stSettleAdj.settleId),
            QdslUtil.FieldDef.like("siteNm", sySite.siteNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("settleAdjId", stSettleAdj.settleAdjId,
                   "regDate", stSettleAdj.regDate),
        new OrderSpecifier<>(Order.DESC, stSettleAdj.regDate),
        new OrderSpecifier<>(Order.ASC, stSettleAdj.settleAdjId));
    }

    /* 정산 조정 수정 */
    @Override
    public int updateSelective(StSettleAdj entity) {
        if (entity.getSettleAdjId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleAdj);
        boolean hasAny = false;

        if (entity.getSettleId()      != null) { update.set(stSettleAdj.settleId,      entity.getSettleId());      hasAny = true; }
        if (entity.getAdjTypeCd()     != null) { update.set(stSettleAdj.adjTypeCd,     entity.getAdjTypeCd());     hasAny = true; }
        if (entity.getAdjAmt()        != null) { update.set(stSettleAdj.adjAmt,        entity.getAdjAmt());        hasAny = true; }
        if (entity.getAdjReason()     != null) { update.set(stSettleAdj.adjReason,     entity.getAdjReason());     hasAny = true; }
        if (entity.getSettleAdjMemo() != null) { update.set(stSettleAdj.settleAdjMemo, entity.getSettleAdjMemo()); hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(stSettleAdj.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettleAdj.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleAdj.settleAdjId.eq(entity.getSettleAdjId())).execute();
        return (int) affected;
    }
}
