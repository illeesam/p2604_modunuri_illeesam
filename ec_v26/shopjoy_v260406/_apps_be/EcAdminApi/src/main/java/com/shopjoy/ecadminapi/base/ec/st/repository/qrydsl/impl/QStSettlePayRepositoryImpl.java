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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettlePayRepository;
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

/** StSettlePay QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettlePayRepositoryImpl implements QStSettlePayRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettlePayRepositoryImpl";
    private static final QStSettlePay stSettlePay     = QStSettlePay.stSettlePay;
    private static final QSyVendor    syVendor   = QSyVendor.syVendor;
    private static final QSySite      sySite   = QSySite.sySite;
    private static final QSyCode      cdPmc = new QSyCode("cd_pmc");
    private static final QSyCode      cdSps = new QSyCode("cd_sps");

    /* 정산 지급 키조회 */
    @Override
    public Optional<StSettlePayDto.Item> selectById(String id) {
        StSettlePayDto.Item dto = baseListQuery()
                .where(stSettlePay.settlePayId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 지급 목록조회 */
    @Override
    public List<StSettlePayDto.Item> selectList(StSettlePayDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettlePayDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettlePayId(search),
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

    /* 정산 지급 페이지조회 */
    @Override
    public StSettlePayDto.PageResponse selectPageData(StSettlePayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettlePayDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndSettlePayId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettlePayDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(stSettlePay.count())
                .from(stSettlePay)
                .where(
                baseAndSiteId(search),
                baseAndSettlePayId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        StSettlePayDto.PageResponse res = new StSettlePayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 지급 baseListQuery */
    private JPAQuery<StSettlePayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettlePayDto.Item.class,
                        stSettlePay.settlePayId, stSettlePay.settleId, stSettlePay.siteId, stSettlePay.vendorId,
                        stSettlePay.payAmt, stSettlePay.payMethodCd, stSettlePay.bankNm, stSettlePay.bankAccount, stSettlePay.bankHolder,
                        stSettlePay.payStatusCd, stSettlePay.payStatusCdBefore, stSettlePay.payDate, stSettlePay.payBy, stSettlePay.settlePayMemo,
                        stSettlePay.regBy, stSettlePay.regDate, stSettlePay.updBy, stSettlePay.updDate,
                        syVendor.vendorNm.as("vendorNm"),
                        sySite.siteNm.as("siteNm"),
                        cdPmc.codeLabel.as("payMethodCdNm"),
                        cdSps.codeLabel.as("payStatusCdNm")
                ))
                .from(stSettlePay)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettlePay.vendorId))
                .leftJoin(sySite).on(sySite.siteId.eq(stSettlePay.siteId))
                .leftJoin(cdPmc).on(cdPmc.codeGrp.eq("PAY_METHOD_CD").and(cdPmc.codeValue.eq(stSettlePay.payMethodCd)))
                .leftJoin(cdSps).on(cdSps.codeGrp.eq("SETTLE_PAY_STATUS").and(cdSps.codeValue.eq(stSettlePay.payStatusCd)));
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(StSettlePayDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? stSettlePay.siteId.eq(search.getSiteId()) : null;
    }

    /* settlePayId 정확 일치 */
    private BooleanExpression baseAndSettlePayId(StSettlePayDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettlePayId())
                ? stSettlePay.settlePayId.eq(search.getSettlePayId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(StSettlePayDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return stSettlePay.regDate.goe(start).and(stSettlePay.regDate.lt(endExcl));
            case "upd_date": return stSettlePay.updDate.goe(start).and(stSettlePay.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(StSettlePayDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",bankAccount,", stSettlePay.bankAccount, pattern);
        or = orLike(or, all, types, ",bankHolder,", stSettlePay.bankHolder, pattern);
        or = orLike(or, all, types, ",bankNm,", stSettlePay.bankNm, pattern);
        or = orLike(or, all, types, ",payBy,", stSettlePay.payBy, pattern);
        or = orLike(or, all, types, ",payMethodCd,", stSettlePay.payMethodCd, pattern);
        or = orLike(or, all, types, ",payStatusCd,", stSettlePay.payStatusCd, pattern);
        or = orLike(or, all, types, ",payStatusCdBefore,", stSettlePay.payStatusCdBefore, pattern);
        or = orLike(or, all, types, ",settleId,", stSettlePay.settleId, pattern);
        or = orLike(or, all, types, ",settlePayId,", stSettlePay.settlePayId, pattern);
        or = orLike(or, all, types, ",settlePayMemo,", stSettlePay.settlePayMemo, pattern);
        or = orLike(or, all, types, ",siteId,", stSettlePay.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", stSettlePay.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StSettlePayDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettlePay.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettlePay.settlePayId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settlePayId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettlePay.settlePayId));
                } else if ("bankNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettlePay.bankNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettlePay.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettlePay.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettlePay.settlePayId));
        }
        return orders;
    }

    /* 정산 지급 수정 */
    @Override
    public int updateSelective(StSettlePay entity) {
        if (entity.getSettlePayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettlePay);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettlePay.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(stSettlePay.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(stSettlePay.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getPayAmt()           != null) { update.set(stSettlePay.payAmt,           entity.getPayAmt());           hasAny = true; }
        if (entity.getPayMethodCd()      != null) { update.set(stSettlePay.payMethodCd,      entity.getPayMethodCd());      hasAny = true; }
        if (entity.getBankNm()           != null) { update.set(stSettlePay.bankNm,           entity.getBankNm());           hasAny = true; }
        if (entity.getBankAccount()      != null) { update.set(stSettlePay.bankAccount,      entity.getBankAccount());      hasAny = true; }
        if (entity.getBankHolder()       != null) { update.set(stSettlePay.bankHolder,       entity.getBankHolder());       hasAny = true; }
        if (entity.getPayStatusCd()      != null) { update.set(stSettlePay.payStatusCd,      entity.getPayStatusCd());      hasAny = true; }
        if (entity.getPayStatusCdBefore()!= null) { update.set(stSettlePay.payStatusCdBefore,entity.getPayStatusCdBefore());hasAny = true; }
        if (entity.getPayDate()          != null) { update.set(stSettlePay.payDate,          entity.getPayDate());          hasAny = true; }
        if (entity.getPayBy()            != null) { update.set(stSettlePay.payBy,            entity.getPayBy());            hasAny = true; }
        if (entity.getSettlePayMemo()    != null) { update.set(stSettlePay.settlePayMemo,    entity.getSettlePayMemo());    hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(stSettlePay.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettlePay.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettlePay.settlePayId.eq(entity.getSettlePayId())).execute();
        return (int) affected;
    }
}
