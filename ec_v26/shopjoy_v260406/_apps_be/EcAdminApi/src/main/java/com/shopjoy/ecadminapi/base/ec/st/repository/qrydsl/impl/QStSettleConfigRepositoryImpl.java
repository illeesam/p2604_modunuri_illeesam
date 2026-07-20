package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleConfigRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QSyCode        cdSc = new QSyCode("cd_sc");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", stSettleConfig.regDate,
        "upd_date", stSettleConfig.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("categoryId", stSettleConfig.categoryId),
        Map.entry("settleConfigId", stSettleConfig.settleConfigId),
        Map.entry("settleConfigRemark", stSettleConfig.settleConfigRemark),
        Map.entry("settleCycleCd", stSettleConfig.settleCycleCd),
        Map.entry("siteId", stSettleConfig.siteId),
        Map.entry("useYn", stSettleConfig.useYn),
        Map.entry("vendorId", stSettleConfig.vendorId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_CYCLE  {DAILY: '일정산', WEEKLY: '주정산'(또는 '주간'), BIWEEKLY: '격주', MONTHLY: '월정산'(또는 '월간')}
     * USE_YN        {Y: '사용', N: '미사용'}
     */
    private JPAQuery<StSettleConfigDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleConfigDto.Item.class,
                        stSettleConfig.settleConfigId,       // 정산기준ID (PK, YYMMDDhhmmss+rand4)
                        stSettleConfig.siteId,                // 사이트ID (sy_site.site_id)
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
                        sySite.siteNm.as("siteNm"),                     // 사이트명 (조인)
                        syVendor.vendorNm.as("vendorNm"),               // 업체명 (조인)
                        pdCategory.categoryNm.as("categoryNm"),         // 카테고리명 (조인)
                        cdSc.codeLabel.as("settleCycleCdNm")            // 정산주기명 (sy_code 조인)
                ))
                .from(stSettleConfig)
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleConfig.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettleConfig.vendorId))
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(stSettleConfig.categoryId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SETTLE_CYCLE").and(cdSc.codeValue.eq(stSettleConfig.settleCycleCd)));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleConfigDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettleConfig.siteId, search.getSiteId()),
                    QdslUtil.strEq(stSettleConfig.settleConfigId, search.getSettleConfigId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
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

    /* 정산 설정 페이지조회 */
    @Override
    public StSettleConfigDto.PageResponse selectPageData(StSettleConfigDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettleConfig.siteId, search.getSiteId()),
                QdslUtil.strEq(stSettleConfig.settleConfigId, search.getSettleConfigId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

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

        StSettleConfigDto.PageResponse res = new StSettleConfigDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(StSettleConfigDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleConfigDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettleConfig.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleConfig.settleConfigId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleConfigId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleConfig.settleConfigId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleConfig.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettleConfig.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleConfig.settleConfigId));
        }
        return orders;
    }

    /* 정산 설정 수정 */
    @Override
    public int updateSelective(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleConfig);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(stSettleConfig.siteId,             entity.getSiteId());             hasAny = true; }
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
