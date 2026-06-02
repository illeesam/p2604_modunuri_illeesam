package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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

    /* 정산 설정 키조회 */
    @Override
    public Optional<StSettleConfigDto.Item> selectById(String id) {
        StSettleConfigDto.Item dto = baseListQuery()
                .where(stSettleConfig.settleConfigId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 설정 목록조회 */
    @Override
    public List<StSettleConfigDto.Item> selectList(StSettleConfigDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleConfigDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettleConfigId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 정산 설정 페이지조회 */
    @Override
    public StSettleConfigDto.PageResponse selectPageData(StSettleConfigDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleConfigDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettleConfigId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleConfigDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(stSettleConfig.count())
                .from(stSettleConfig)
                .where(
                baseAndSiteId(search),
                baseAndSettleConfigId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        StSettleConfigDto.PageResponse res = new StSettleConfigDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 설정 baseListQuery */
    private JPAQuery<StSettleConfigDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleConfigDto.Item.class,
                        stSettleConfig.settleConfigId, stSettleConfig.siteId, stSettleConfig.vendorId, stSettleConfig.categoryId,
                        stSettleConfig.settleCycleCd, stSettleConfig.settleDay, stSettleConfig.commissionRate, stSettleConfig.minSettleAmt,
                        stSettleConfig.settleConfigRemark, stSettleConfig.useYn,
                        stSettleConfig.regBy, stSettleConfig.regDate, stSettleConfig.updBy, stSettleConfig.updDate,
                        sySite.siteNm.as("siteNm"),
                        syVendor.vendorNm.as("vendorNm"),
                        pdCategory.categoryNm.as("categoryNm"),
                        cdSc.codeLabel.as("settleCycleCdNm")
                ))
                .from(stSettleConfig)
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleConfig.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettleConfig.vendorId))
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(stSettleConfig.categoryId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SETTLE_CYCLE").and(cdSc.codeValue.eq(stSettleConfig.settleCycleCd)));
    }

    /* 정산 설정 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(StSettleConfigDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? stSettleConfig.siteId.eq(search.getSiteId()) : null;
    }

    /* settleConfigId 정확 일치 */
    private BooleanExpression baseAndSettleConfigId(StSettleConfigDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleConfigId())
                ? stSettleConfig.settleConfigId.eq(search.getSettleConfigId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(StSettleConfigDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return stSettleConfig.regDate.goe(start).and(stSettleConfig.regDate.lt(endExcl));
            case "upd_date": return stSettleConfig.updDate.goe(start).and(stSettleConfig.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(StSettleConfigDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",categoryId,", stSettleConfig.categoryId, pattern);
        or = orLike(or, all, types, ",settleConfigId,", stSettleConfig.settleConfigId, pattern);
        or = orLike(or, all, types, ",settleConfigRemark,", stSettleConfig.settleConfigRemark, pattern);
        or = orLike(or, all, types, ",settleCycleCd,", stSettleConfig.settleCycleCd, pattern);
        or = orLike(or, all, types, ",siteId,", stSettleConfig.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", stSettleConfig.useYn, pattern);
        or = orLike(or, all, types, ",vendorId,", stSettleConfig.vendorId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
