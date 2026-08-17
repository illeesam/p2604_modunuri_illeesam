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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StDlivFeePolicyDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStDlivFeePolicy;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StDlivFeePolicy;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStDlivFeePolicyRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** StDlivFeePolicy QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStDlivFeePolicyRepositoryImpl implements QStDlivFeePolicyRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStDlivFeePolicyRepositoryImpl";
    private static final QStDlivFeePolicy stDlivFeePolicy = QStDlivFeePolicy.stDlivFeePolicy;
    private static final QVwSyCode        cdDm = new QVwSyCode("cd_dm");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of(
        "reg_date", stDlivFeePolicy.regDate,
        "upd_date", stDlivFeePolicy.updDate
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * DLIV_METHOD_CD  {COURIER:택배, DIRECT:직접배송, PICKUP:방문수령, SAME_DAY:당일배송, QUICK:퀵배송, REMOTE:오지배송, HALF_COURIER:반값택배배송, POST:우체국배송}
     * USE_YN          {Y:사용, N:미사용}
     */
    private JPAQuery<StDlivFeePolicyDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StDlivFeePolicyDto.Item.class,
                        stDlivFeePolicy.dlivFeePolicyId,   // 배송수수료정책ID
                        stDlivFeePolicy.dlivMethodCd,      // 배송방법 — DLIV_METHOD_CD
                        stDlivFeePolicy.feeRate,           // 수수료율(%)
                        stDlivFeePolicy.feeAmt,            // 수수료 정액(원)
                        stDlivFeePolicy.siteId,            // 사이트ID
                        stDlivFeePolicy.useYn,             // 사용여부 Y/N
                        stDlivFeePolicy.sortOrd,           // 정렬순서
                        stDlivFeePolicy.remark,            // 비고
                        stDlivFeePolicy.regBy, stDlivFeePolicy.regDate, stDlivFeePolicy.regSiteId,
                        stDlivFeePolicy.updBy, stDlivFeePolicy.updDate,
                        cdDm.codeLabel.as("dlivMethodCdNm")   // 배송방법명 (sy_code 조인)
                ))
                .from(stDlivFeePolicy)
                .leftJoin(cdDm).on(cdDm.codeGrp.eq("DLIV_METHOD_CD").and(cdDm.codeValue.eq(stDlivFeePolicy.dlivMethodCd)));
    }

    /* 배송수수료정책 키조회 */
    @Override
    public Optional<StDlivFeePolicyDto.Item> selectById(String id) {
        StDlivFeePolicyDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stDlivFeePolicy.dlivFeePolicyId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송수수료정책 목록조회 */
    @Override
    public List<StDlivFeePolicyDto.Item> selectList(StDlivFeePolicyDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<StDlivFeePolicyDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stDlivFeePolicy.siteId, search.getSiteId()),
                    QdslUtil.strEq(stDlivFeePolicy.dlivMethodCd, search.getDlivMethodCd()),
                    QdslUtil.strEq(stDlivFeePolicy.useYn, search.getUseYn()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
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

    /* 배송수수료정책 페이지조회 */
    @Override
    public BasePage<StDlivFeePolicyDto.Item> selectPageData(StDlivFeePolicyDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stDlivFeePolicy.siteId, search.getSiteId()),
                QdslUtil.strEq(stDlivFeePolicy.dlivMethodCd, search.getDlivMethodCd()),
                QdslUtil.strEq(stDlivFeePolicy.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StDlivFeePolicyDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StDlivFeePolicyDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stDlivFeePolicy.count())
                .where(wheres)
                .fetchOne();

        BasePage<StDlivFeePolicyDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("dlivMethodCd", stDlivFeePolicy.dlivMethodCd),
            QdslUtil.FieldDef.like("remark", stDlivFeePolicy.remark)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "sortOrd asc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("dlivFeePolicyId", stDlivFeePolicy.dlivFeePolicyId,
                   "sortOrd", stDlivFeePolicy.sortOrd,
                   "regDate", stDlivFeePolicy.regDate),
        new OrderSpecifier<>(Order.ASC, stDlivFeePolicy.sortOrd),
        new OrderSpecifier<>(Order.ASC, stDlivFeePolicy.regDate));
    }

    /* 배송수수료정책 수정 */
    @Override
    public int updateSelective(StDlivFeePolicy entity) {
        if (entity.getDlivFeePolicyId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stDlivFeePolicy);
        boolean hasAny = false;

        if (entity.getDlivMethodCd() != null) { update.set(stDlivFeePolicy.dlivMethodCd, entity.getDlivMethodCd()); hasAny = true; }
        if (entity.getFeeRate()      != null) { update.set(stDlivFeePolicy.feeRate,      entity.getFeeRate());      hasAny = true; }
        if (entity.getFeeAmt()       != null) { update.set(stDlivFeePolicy.feeAmt,       entity.getFeeAmt());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(stDlivFeePolicy.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(stDlivFeePolicy.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(stDlivFeePolicy.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getRemark()       != null) { update.set(stDlivFeePolicy.remark,       entity.getRemark());       hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(stDlivFeePolicy.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stDlivFeePolicy.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stDlivFeePolicy.dlivFeePolicyId.eq(entity.getDlivFeePolicyId())).execute();
        return (int) affected;
    }
}
