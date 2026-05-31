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
    private static final QPmVoucher v    = QPmVoucher.pmVoucher;
    private static final QSySite    ste  = QSySite.sySite;
    private static final QSyCode    cdVt = new QSyCode("cd_vt");
    private static final QSyCode    cdVs = new QSyCode("cd_vs");

    /* 바우처(상품권) baseQuery */
    private JPAQuery<PmVoucherDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherDto.Item.class,
                        v.voucherId, v.siteId, v.voucherNm, v.voucherTypeCd, v.voucherValue,
                        v.minOrderAmt, v.maxDiscntAmt, v.expireMonth,
                        v.voucherStatusCd, v.voucherStatusCdBefore, v.voucherDesc, v.useYn,
                        v.regBy, v.regDate, v.updBy, v.updDate
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VOUCHER_TYPE").and(cdVt.codeValue.eq(v.voucherTypeCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VOUCHER_STATUS").and(cdVs.codeValue.eq(v.voucherStatusCd)));
    }

    /* 바우처(상품권) 키조회 */
    @Override
    public Optional<PmVoucherDto.Item> selectById(String voucherId) {
        PmVoucherDto.Item dto = baseQuery()
                .where(v.voucherId.eq(voucherId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 목록조회 */
    @Override
    public List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseQuery().where(
                andSiteId(search),
                andVoucherId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
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
    public PmVoucherDto.PageResponse selectPageList(PmVoucherDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseQuery().where(
                andSiteId(search),
                andVoucherId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmVoucherDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(v.count())
                .from(v)
                .where(
                andSiteId(search),
                andVoucherId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmVoucherDto.PageResponse res = new PmVoucherDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? v.siteId.eq(search.getSiteId()) : null;
    }

    /* voucherId 정확 일치 */
    private BooleanExpression andVoucherId(PmVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getVoucherId())
                ? v.voucherId.eq(search.getVoucherId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(PmVoucherDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? v.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmVoucherDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return v.regDate.goe(start).and(v.regDate.lt(endExcl));
            case "upd_date": return v.updDate.goe(start).and(v.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmVoucherDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",siteId,", v.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", v.useYn, pattern);
        or = orLike(or, all, types, ",voucherDesc,", v.voucherDesc, pattern);
        or = orLike(or, all, types, ",voucherId,", v.voucherId, pattern);
        or = orLike(or, all, types, ",voucherNm,", v.voucherNm, pattern);
        or = orLike(or, all, types, ",voucherStatusCd,", v.voucherStatusCd, pattern);
        or = orLike(or, all, types, ",voucherStatusCdBefore,", v.voucherStatusCdBefore, pattern);
        or = orLike(or, all, types, ",voucherTypeCd,", v.voucherTypeCd, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, v.voucherId));
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
                    orders.add(new OrderSpecifier(order, v.voucherId));
                } else if ("voucherNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.voucherNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, v.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, v.voucherId));
        }
        return orders;
    }

    /* 바우처(상품권) 수정 */
    @Override
    public int updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(v.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVoucherNm()             != null) { update.set(v.voucherNm,             entity.getVoucherNm());             hasAny = true; }
        if (entity.getVoucherTypeCd()         != null) { update.set(v.voucherTypeCd,         entity.getVoucherTypeCd());         hasAny = true; }
        if (entity.getVoucherValue()          != null) { update.set(v.voucherValue,          entity.getVoucherValue());          hasAny = true; }
        if (entity.getMinOrderAmt()           != null) { update.set(v.minOrderAmt,           entity.getMinOrderAmt());           hasAny = true; }
        if (entity.getMaxDiscntAmt()          != null) { update.set(v.maxDiscntAmt,          entity.getMaxDiscntAmt());          hasAny = true; }
        if (entity.getExpireMonth()           != null) { update.set(v.expireMonth,           entity.getExpireMonth());           hasAny = true; }
        if (entity.getVoucherStatusCd()       != null) { update.set(v.voucherStatusCd,       entity.getVoucherStatusCd());       hasAny = true; }
        if (entity.getVoucherStatusCdBefore() != null) { update.set(v.voucherStatusCdBefore, entity.getVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDesc()           != null) { update.set(v.voucherDesc,           entity.getVoucherDesc());           hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(v.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(v.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(v.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(v.voucherId.eq(entity.getVoucherId())).execute();
        return (int) affected;
    }
}
