package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherRepositoryImpl implements QPmVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmVoucherRepositoryImpl";
    private static final QPmVoucher pmVoucher    = QPmVoucher.pmVoucher;
    private static final QSySite    sySite  = QSySite.sySite;
    private static final QSyCode    cdVt = new QSyCode("cd_vt");
    private static final QSyCode    cdVs = new QSyCode("cd_vs");

    /* 바우처(상품권) baseSelColumnQuery */
    private JPAQuery<PmVoucherDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherDto.Item.class,
                        pmVoucher.voucherId, pmVoucher.siteId, pmVoucher.voucherNm, pmVoucher.voucherTypeCd, pmVoucher.voucherValue,
                        pmVoucher.minOrderAmt, pmVoucher.maxDiscntAmt, pmVoucher.expireMonth,
                        pmVoucher.voucherStatusCd, pmVoucher.voucherStatusCdBefore, pmVoucher.voucherDesc, pmVoucher.useYn,
                        pmVoucher.regBy, pmVoucher.regDate, pmVoucher.updBy, pmVoucher.updDate
                ))
                .from(pmVoucher)
                .leftJoin(sySite).on(sySite.siteId.eq(pmVoucher.siteId))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VOUCHER_TYPE").and(cdVt.codeValue.eq(pmVoucher.voucherTypeCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VOUCHER_STATUS").and(cdVs.codeValue.eq(pmVoucher.voucherStatusCd)));
    }

    /* 바우처(상품권) 키조회 */
    @Override
    public Optional<PmVoucherDto.Item> selectById(String voucherId) {
        PmVoucherDto.Item dto = baseSelColumnQuery()
                .where(pmVoucher.voucherId.eq(voucherId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 목록조회 */
    @Override
    public List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndVoucherId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 바우처(상품권) 페이지조회 */
    @Override
    public PmVoucherDto.PageResponse selectPageData(PmVoucherDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndVoucherId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmVoucherDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmVoucher.count())
                .from(pmVoucher)
                .where(
                baseAndSiteId(search),
                baseAndVoucherId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmVoucherDto.PageResponse res = new PmVoucherDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmVoucher.siteId.eq(search.getSiteId()) : null;
    }

    /* voucherId 정확 일치 */
    private BooleanExpression baseAndVoucherId(PmVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getVoucherId())
                ? pmVoucher.voucherId.eq(search.getVoucherId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? pmVoucher.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmVoucherDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmVoucher.regDate.goe(start).and(pmVoucher.regDate.lt(endExcl));
            case "upd_date": return pmVoucher.updDate.goe(start).and(pmVoucher.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmVoucherDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",siteId,", pmVoucher.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", pmVoucher.useYn, pattern);
        or = orLike(or, all, types, ",voucherDesc,", pmVoucher.voucherDesc, pattern);
        or = orLike(or, all, types, ",voucherId,", pmVoucher.voucherId, pattern);
        or = orLike(or, all, types, ",voucherNm,", pmVoucher.voucherNm, pattern);
        or = orLike(or, all, types, ",voucherStatusCd,", pmVoucher.voucherStatusCd, pattern);
        or = orLike(or, all, types, ",voucherStatusCdBefore,", pmVoucher.voucherStatusCdBefore, pattern);
        or = orLike(or, all, types, ",voucherTypeCd,", pmVoucher.voucherTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmVoucherDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmVoucher.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucher.voucherId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("voucherId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucher.voucherId));
                } else if ("voucherNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucher.voucherNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucher.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmVoucher.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucher.voucherId));
        }
        return orders;
    }

    /* 바우처(상품권) 수정 */
    @Override
    public int updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmVoucher);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(pmVoucher.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVoucherNm()             != null) { update.set(pmVoucher.voucherNm,             entity.getVoucherNm());             hasAny = true; }
        if (entity.getVoucherTypeCd()         != null) { update.set(pmVoucher.voucherTypeCd,         entity.getVoucherTypeCd());         hasAny = true; }
        if (entity.getVoucherValue()          != null) { update.set(pmVoucher.voucherValue,          entity.getVoucherValue());          hasAny = true; }
        if (entity.getMinOrderAmt()           != null) { update.set(pmVoucher.minOrderAmt,           entity.getMinOrderAmt());           hasAny = true; }
        if (entity.getMaxDiscntAmt()          != null) { update.set(pmVoucher.maxDiscntAmt,          entity.getMaxDiscntAmt());          hasAny = true; }
        if (entity.getExpireMonth()           != null) { update.set(pmVoucher.expireMonth,           entity.getExpireMonth());           hasAny = true; }
        if (entity.getVoucherStatusCd()       != null) { update.set(pmVoucher.voucherStatusCd,       entity.getVoucherStatusCd());       hasAny = true; }
        if (entity.getVoucherStatusCdBefore() != null) { update.set(pmVoucher.voucherStatusCdBefore, entity.getVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDesc()           != null) { update.set(pmVoucher.voucherDesc,           entity.getVoucherDesc());           hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(pmVoucher.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(pmVoucher.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmVoucher.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmVoucher.voucherId.eq(entity.getVoucherId())).execute();
        return (int) affected;
    }
}
