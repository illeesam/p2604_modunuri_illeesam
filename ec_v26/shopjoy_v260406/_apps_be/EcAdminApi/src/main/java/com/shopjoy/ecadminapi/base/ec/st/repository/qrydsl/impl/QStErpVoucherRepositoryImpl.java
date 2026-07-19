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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherRepository;
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
/** StErpVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherRepositoryImpl implements QStErpVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStErpVoucherRepositoryImpl";
    private static final QStErpVoucher stErpVoucher    = QStErpVoucher.stErpVoucher;
    private static final QSySite       sySite  = QSySite.sySite;
    private static final QSyVendor     syVendor  = QSyVendor.syVendor;
    private static final QSyCode       cdEvt = new QSyCode("cd_evt");
    private static final QSyCode       cdEvs = new QSyCode("cd_evs");

    /* ERP 전표 baseListQuery */
    private JPAQuery<StErpVoucherDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StErpVoucherDto.Item.class,
                        stErpVoucher.erpVoucherId, stErpVoucher.siteId, stErpVoucher.vendorId, stErpVoucher.settleId, stErpVoucher.settleYm,
                        stErpVoucher.erpVoucherTypeCd, stErpVoucher.erpVoucherStatusCd, stErpVoucher.erpVoucherStatusCdBefore,
                        stErpVoucher.voucherDate, stErpVoucher.erpVoucherDesc,
                        stErpVoucher.totalDebitAmt, stErpVoucher.totalCreditAmt,
                        stErpVoucher.erpSendDate, stErpVoucher.erpVoucherNo, stErpVoucher.erpResMsg,
                        stErpVoucher.regBy, stErpVoucher.regDate, stErpVoucher.updBy, stErpVoucher.updDate,
                        sySite.siteNm.as("siteNm"),
                        syVendor.vendorNm.as("vendorNm"),
                        cdEvt.codeLabel.as("erpVoucherTypeCdNm"),
                        cdEvs.codeLabel.as("erpVoucherStatusCdNm")
                ))
                .from(stErpVoucher)
                .leftJoin(sySite).on(sySite.siteId.eq(stErpVoucher.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stErpVoucher.vendorId))
                .leftJoin(cdEvt).on(cdEvt.codeGrp.eq("ERP_VOUCHER_TYPE").and(cdEvt.codeValue.eq(stErpVoucher.erpVoucherTypeCd)))
                .leftJoin(cdEvs).on(cdEvs.codeGrp.eq("ERP_VOUCHER_STATUS").and(cdEvs.codeValue.eq(stErpVoucher.erpVoucherStatusCd)));
    }

    /* ERP 전표 키조회 */
    @Override
    public Optional<StErpVoucherDto.Item> selectById(String id) {
        StErpVoucherDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stErpVoucher.erpVoucherId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* ERP 전표 목록조회 */
    @Override
    public List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StErpVoucherDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andErpVoucherIdEq(search),
                    andErpVoucherTypeCdEq(search),
                    andErpVoucherStatusCdEq(search),
                    andDateRangeBetween(search),
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

    /* ERP 전표 페이지조회 */
    @Override
    public StErpVoucherDto.PageResponse selectPageData(StErpVoucherDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andErpVoucherIdEq(search),
                andErpVoucherTypeCdEq(search),
                andErpVoucherStatusCdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StErpVoucherDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StErpVoucherDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stErpVoucher.count())
                .where(wheres)
                .fetchOne();

        StErpVoucherDto.PageResponse res = new StErpVoucherDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* ERP 전표 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(StErpVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? stErpVoucher.siteId.eq(search.getSiteId()) : null;
    }

    /* erpVoucherId 정확 일치 */
    private BooleanExpression andErpVoucherIdEq(StErpVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getErpVoucherId())
                ? stErpVoucher.erpVoucherId.eq(search.getErpVoucherId()) : null;
    }

    /* erpVoucherTypeCd 정확 일치 */
    private BooleanExpression andErpVoucherTypeCdEq(StErpVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getErpVoucherTypeCd())
                ? stErpVoucher.erpVoucherTypeCd.eq(search.getErpVoucherTypeCd()) : null;
    }

    /* erpVoucherStatusCd 정확 일치 */
    private BooleanExpression andErpVoucherStatusCdEq(StErpVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getErpVoucherStatusCd())
                ? stErpVoucher.erpVoucherStatusCd.eq(search.getErpVoucherStatusCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(StErpVoucherDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate startDate = LocalDate.parse(search.getDateStart(), fmt);
        LocalDate endIncl   = LocalDate.parse(search.getDateEnd(),   fmt);
        LocalDateTime start   = startDate.atStartOfDay();
        LocalDateTime endExcl = endIncl.plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "voucher_date": return stErpVoucher.voucherDate.goe(startDate).and(stErpVoucher.voucherDate.loe(endIncl));
            case "reg_date": return stErpVoucher.regDate.goe(start).and(stErpVoucher.regDate.lt(endExcl));
            case "upd_date": return stErpVoucher.updDate.goe(start).and(stErpVoucher.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(StErpVoucherDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",erpResMsg,", stErpVoucher.erpResMsg, pattern);
        or = orLike(or, all, types, ",erpVoucherDesc,", stErpVoucher.erpVoucherDesc, pattern);
        or = orLike(or, all, types, ",erpVoucherId,", stErpVoucher.erpVoucherId, pattern);
        or = orLike(or, all, types, ",erpVoucherNo,", stErpVoucher.erpVoucherNo, pattern);
        or = orLike(or, all, types, ",erpVoucherStatusCd,", stErpVoucher.erpVoucherStatusCd, pattern);
        or = orLike(or, all, types, ",erpVoucherStatusCdBefore,", stErpVoucher.erpVoucherStatusCdBefore, pattern);
        or = orLike(or, all, types, ",erpVoucherTypeCd,", stErpVoucher.erpVoucherTypeCd, pattern);
        or = orLike(or, all, types, ",settleId,", stErpVoucher.settleId, pattern);
        or = orLike(or, all, types, ",settleYm,", stErpVoucher.settleYm, pattern);
        or = orLike(or, all, types, ",siteId,", stErpVoucher.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", stErpVoucher.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StErpVoucherDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stErpVoucher.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stErpVoucher.erpVoucherId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("erpVoucherId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stErpVoucher.erpVoucherId));
                } else if ("settleYm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stErpVoucher.settleYm));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stErpVoucher.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stErpVoucher.erpVoucherId));
        }
        return orders;
    }

    /* ERP 전표 수정 */
    @Override
    public int updateSelective(StErpVoucher entity) {
        if (entity.getErpVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stErpVoucher);
        boolean hasAny = false;

        if (entity.getSiteId()                   != null) { update.set(stErpVoucher.siteId,                   entity.getSiteId());                   hasAny = true; }
        if (entity.getVendorId()                 != null) { update.set(stErpVoucher.vendorId,                 entity.getVendorId());                 hasAny = true; }
        if (entity.getSettleId()                 != null) { update.set(stErpVoucher.settleId,                 entity.getSettleId());                 hasAny = true; }
        if (entity.getSettleYm()                 != null) { update.set(stErpVoucher.settleYm,                 entity.getSettleYm());                 hasAny = true; }
        if (entity.getErpVoucherTypeCd()         != null) { update.set(stErpVoucher.erpVoucherTypeCd,         entity.getErpVoucherTypeCd());         hasAny = true; }
        if (entity.getErpVoucherStatusCd()       != null) { update.set(stErpVoucher.erpVoucherStatusCd,       entity.getErpVoucherStatusCd());       hasAny = true; }
        if (entity.getErpVoucherStatusCdBefore() != null) { update.set(stErpVoucher.erpVoucherStatusCdBefore, entity.getErpVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDate()              != null) { update.set(stErpVoucher.voucherDate,              entity.getVoucherDate());              hasAny = true; }
        if (entity.getErpVoucherDesc()           != null) { update.set(stErpVoucher.erpVoucherDesc,           entity.getErpVoucherDesc());           hasAny = true; }
        if (entity.getTotalDebitAmt()            != null) { update.set(stErpVoucher.totalDebitAmt,            entity.getTotalDebitAmt());            hasAny = true; }
        if (entity.getTotalCreditAmt()           != null) { update.set(stErpVoucher.totalCreditAmt,           entity.getTotalCreditAmt());           hasAny = true; }
        if (entity.getErpSendDate()              != null) { update.set(stErpVoucher.erpSendDate,              entity.getErpSendDate());              hasAny = true; }
        if (entity.getErpVoucherNo()             != null) { update.set(stErpVoucher.erpVoucherNo,             entity.getErpVoucherNo());             hasAny = true; }
        if (entity.getErpResMsg()                != null) { update.set(stErpVoucher.erpResMsg,                entity.getErpResMsg());                hasAny = true; }
        if (entity.getUpdBy()                    != null) { update.set(stErpVoucher.updBy,                    entity.getUpdBy());                    hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stErpVoucher.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stErpVoucher.erpVoucherId.eq(entity.getErpVoucherId())).execute();
        return (int) affected;
    }
}
