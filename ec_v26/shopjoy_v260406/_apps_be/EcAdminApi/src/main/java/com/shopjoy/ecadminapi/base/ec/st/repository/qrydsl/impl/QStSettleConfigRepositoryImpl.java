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
    private static final QStSettleConfig a    = QStSettleConfig.stSettleConfig;
    private static final QSySite        ste  = QSySite.sySite;
    private static final QSyVendor      vnd  = QSyVendor.syVendor;
    private static final QPdCategory    cat  = QPdCategory.pdCategory;
    private static final QSyCode        cdSc = new QSyCode("cd_sc");

    /* 정산 설정 키조회 */
    @Override
    public Optional<StSettleConfigDto.Item> selectById(String id) {
        StSettleConfigDto.Item dto = baseListQuery()
                .where(a.settleConfigId.eq(id))
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
                .select(a.count())
                .from(a)
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
                        a.settleConfigId, a.siteId, a.vendorId, a.categoryId,
                        a.settleCycleCd, a.settleDay, a.commissionRate, a.minSettleAmt,
                        a.settleConfigRemark, a.useYn,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        vnd.vendorNm.as("vendorNm"),
                        cat.categoryNm.as("categoryNm"),
                        cdSc.codeLabel.as("settleCycleCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(a.vendorId))
                .leftJoin(cat).on(cat.categoryId.eq(a.categoryId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SETTLE_CYCLE").and(cdSc.codeValue.eq(a.settleCycleCd)));
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
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* settleConfigId 정확 일치 */
    private BooleanExpression baseAndSettleConfigId(StSettleConfigDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleConfigId())
                ? a.settleConfigId.eq(search.getSettleConfigId()) : null;
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
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",categoryId,", a.categoryId, pattern);
        or = orLike(or, all, types, ",settleConfigId,", a.settleConfigId, pattern);
        or = orLike(or, all, types, ",settleConfigRemark,", a.settleConfigRemark, pattern);
        or = orLike(or, all, types, ",settleCycleCd,", a.settleCycleCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
        or = orLike(or, all, types, ",vendorId,", a.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleConfigId));
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
                    orders.add(new OrderSpecifier(order, a.settleConfigId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleConfigId));
        }
        return orders;
    }

    /* 정산 설정 수정 */
    @Override
    public int updateSelective(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(a.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getVendorId()           != null) { update.set(a.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getCategoryId()         != null) { update.set(a.categoryId,         entity.getCategoryId());         hasAny = true; }
        if (entity.getSettleCycleCd()      != null) { update.set(a.settleCycleCd,      entity.getSettleCycleCd());      hasAny = true; }
        if (entity.getSettleDay()          != null) { update.set(a.settleDay,          entity.getSettleDay());          hasAny = true; }
        if (entity.getCommissionRate()     != null) { update.set(a.commissionRate,     entity.getCommissionRate());     hasAny = true; }
        if (entity.getMinSettleAmt()       != null) { update.set(a.minSettleAmt,       entity.getMinSettleAmt());       hasAny = true; }
        if (entity.getSettleConfigRemark() != null) { update.set(a.settleConfigRemark, entity.getSettleConfigRemark()); hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(a.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(a.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.settleConfigId.eq(entity.getSettleConfigId())).execute();
        return (int) affected;
    }
}
