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
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleConfigRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettleConfig QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleConfigRepositoryImpl implements QStSettleConfigRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleConfigRepositoryImpl";
    private static final QStSettleConfig stSettleConfig    = QStSettleConfig.stSettleConfig;
    private static final QSySite        sySite  = QSySite.sySite;
    private static final QSyVendor      syVendor  = QSyVendor.syVendor;
    private static final QPdCategory    pdCategory  = QPdCategory.pdCategory;
    private static final QVwSyCode        cdSc = new QVwSyCode("cd_sc");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_CYCLE  {DAILY: '일정산', WEEKLY: '주정산'(또는 '주간'), BIWEEKLY: '격주', MONTHLY: '월정산'(또는 '월간')}
     * USE_YN        {Y: '사용', N: '미사용'}
     */
    private JPAQuery<StSettleConfigDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleConfigDto.Item.class,
                        stSettleConfig.settleConfigId,       // 정산기준ID (PK, YYMMDDhhmmss+rand4)
                        stSettleConfig.vendorId,               // 업체ID (NULL=전체 기준)
                        stSettleConfig.categoryId,             // 카테고리ID (NULL=전체 기준)
                        stSettleConfig.settleCycleCd,          // 정산주기 — SETTLE_CYCLE {DAILY: '일정산', WEEKLY: '주정산', BIWEEKLY: '격주', MONTHLY: '월정산'}
                        stSettleConfig.settleDay,              // 정산일 (월 N일, MONTHLY 시 사용)
                        stSettleConfig.commissionRate,         // 수수료율 (%)
                        stSettleConfig.minSettleAmt,           // 최소 정산금액
                        stSettleConfig.settleConfigRemark,     // 비고
                        stSettleConfig.useYn,                  // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        stSettleConfig.regBy,                  // 등록자
                        stSettleConfig.regDate,                // 등록일시
                        stSettleConfig.updBy,                  // 수정자
                        stSettleConfig.updDate,                // 수정일시
                        syVendor.vendorNm.as("vendorNm"),               // 업체명 (조인)
                        pdCategory.categoryNm.as("categoryNm"),         // 카테고리명 (조인)
                        cdSc.codeLabel.as("settleCycleCdNm")            // 정산주기명 (sy_code 조인)
                ))
                .from(stSettleConfig)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettleConfig.vendorId))
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(stSettleConfig.categoryId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SETTLE_CYCLE_CD").and(cdSc.codeValue.eq(stSettleConfig.settleCycleCd)));
    }

    /* 정산 설정 키조회 */
    @Override
    public Optional<StSettleConfigDto.Item> selectById(String id) {
        StSettleConfigDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleConfig.settleConfigId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 설정 목록조회 */
    @Override
    public List<StSettleConfigDto.Item> selectList(StSettleConfigDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(stSettleConfig.settleConfigId, search.getSettleConfigId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(stSettleConfig.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(stSettleConfig.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<StSettleConfigDto.Item> query = baseListQuery()
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

    /* 정산 설정 페이지조회 */
    @Override
    public BasePage<StSettleConfigDto.Item> selectPageData(StSettleConfigDto.Request search) {
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
        whereList.add(QdslUtil.strEq(stSettleConfig.settleConfigId, search.getSettleConfigId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleConfig.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(stSettleConfig.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleConfigDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleConfigDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleConfig.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleConfigDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("categoryId", stSettleConfig.categoryId),
            QdslUtil.FieldDef.like("settleConfigId", stSettleConfig.settleConfigId),
            QdslUtil.FieldDef.like("settleConfigRemark", stSettleConfig.settleConfigRemark),
            QdslUtil.FieldDef.like("settleCycleCd", stSettleConfig.settleCycleCd),
            QdslUtil.FieldDef.like("useYn", stSettleConfig.useYn),
            QdslUtil.FieldDef.like("vendorId", stSettleConfig.vendorId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("settleConfigId", stSettleConfig.settleConfigId,
                   "regDate", stSettleConfig.regDate),
        new OrderSpecifier<>(Order.DESC, stSettleConfig.regDate),
        new OrderSpecifier<>(Order.ASC, stSettleConfig.settleConfigId));
    }

    /* 정산 설정 수정 */
    @Override
    public int updateSelective(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleConfig);
        boolean hasAny = false;

        if (entity.getVendorId()           != null) { update.set(stSettleConfig.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getCategoryId()         != null) { update.set(stSettleConfig.categoryId,         entity.getCategoryId());         hasAny = true; }
        if (entity.getSettleCycleCd()      != null) { update.set(stSettleConfig.settleCycleCd,      entity.getSettleCycleCd());      hasAny = true; }
        if (entity.getSettleDay()          != null) { update.set(stSettleConfig.settleDay,          entity.getSettleDay());          hasAny = true; }
        if (entity.getCommissionRate()     != null) { update.set(stSettleConfig.commissionRate,     entity.getCommissionRate());     hasAny = true; }
        if (entity.getMinSettleAmt()       != null) { update.set(stSettleConfig.minSettleAmt,       entity.getMinSettleAmt());       hasAny = true; }
        if (entity.getSettleConfigRemark() != null) { update.set(stSettleConfig.settleConfigRemark, entity.getSettleConfigRemark()); hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(stSettleConfig.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(stSettleConfig.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettleConfig.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleConfig.settleConfigId.eq(entity.getSettleConfigId())).execute();
        return (int) affected;
    }
}
