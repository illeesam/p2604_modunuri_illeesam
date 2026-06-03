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
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherIssueRepository;
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
/** PmVoucherIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherIssueRepositoryImpl implements QPmVoucherIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmVoucherIssueRepositoryImpl";
    private static final QPmVoucherIssue pmVoucherIssue    = QPmVoucherIssue.pmVoucherIssue;
    private static final QPmVoucher      pmVoucher  = QPmVoucher.pmVoucher;
    private static final QOdOrder        odOrder  = QOdOrder.odOrder;
    private static final QSySite         sySite  = QSySite.sySite;
    private static final QSyCode         cdVis = new QSyCode("cd_vis");

    /* 바우처(상품권) 발행 이력 baseSelColumnQuery */
    private JPAQuery<PmVoucherIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherIssueDto.Item.class,
                        pmVoucherIssue.voucherIssueId, pmVoucherIssue.voucherId, pmVoucherIssue.siteId, pmVoucherIssue.memberId, pmVoucherIssue.voucherCode,
                        pmVoucherIssue.issueDate, pmVoucherIssue.expireDate, pmVoucherIssue.useDate, pmVoucherIssue.orderId, pmVoucherIssue.useAmt,
                        pmVoucherIssue.voucherIssueStatusCd, pmVoucherIssue.voucherIssueStatusCdBefore,
                        pmVoucherIssue.regBy, pmVoucherIssue.regDate, pmVoucherIssue.updBy, pmVoucherIssue.updDate
                ))
                .from(pmVoucherIssue)
                .leftJoin(pmVoucher).on(pmVoucher.voucherId.eq(pmVoucherIssue.voucherId))
                .leftJoin(odOrder).on(odOrder.orderId.eq(pmVoucherIssue.orderId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmVoucherIssue.siteId))
                .leftJoin(cdVis).on(cdVis.codeGrp.eq("VOUCHER_ISSUE_STATUS").and(cdVis.codeValue.eq(pmVoucherIssue.voucherIssueStatusCd)));
    }

    /* 바우처(상품권) 발행 이력 키조회 */
    @Override
    public Optional<PmVoucherIssueDto.Item> selectById(String voucherIssueId) {
        PmVoucherIssueDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmVoucherIssue.voucherIssueId.eq(voucherIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 발행 이력 목록조회 */
    @Override
    public List<PmVoucherIssueDto.Item> selectList(PmVoucherIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndVoucherIssueId(search),
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

    /* 바우처(상품권) 발행 이력 페이지조회 */
    @Override
    public PmVoucherIssueDto.PageResponse selectPageData(PmVoucherIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndVoucherIssueId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmVoucherIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmVoucherIssue.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(pmVoucherIssue)
                .where(wheres)
                .fetchOne();

        PmVoucherIssueDto.PageResponse res = new PmVoucherIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 바우처(상품권) 발행 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmVoucherIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmVoucherIssue.siteId.eq(search.getSiteId()) : null;
    }

    /* voucherIssueId 정확 일치 */
    private BooleanExpression baseAndVoucherIssueId(PmVoucherIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getVoucherIssueId())
                ? pmVoucherIssue.voucherIssueId.eq(search.getVoucherIssueId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmVoucherIssueDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "issue_date": return pmVoucherIssue.issueDate.goe(start).and(pmVoucherIssue.issueDate.lt(endExcl));
            case "reg_date": return pmVoucherIssue.regDate.goe(start).and(pmVoucherIssue.regDate.lt(endExcl));
            case "upd_date": return pmVoucherIssue.updDate.goe(start).and(pmVoucherIssue.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmVoucherIssueDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", pmVoucherIssue.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", pmVoucherIssue.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", pmVoucherIssue.siteId, pattern);
        or = orLike(or, all, types, ",voucherCode,", pmVoucherIssue.voucherCode, pattern);
        or = orLike(or, all, types, ",voucherId,", pmVoucherIssue.voucherId, pattern);
        or = orLike(or, all, types, ",voucherIssueId,", pmVoucherIssue.voucherIssueId, pattern);
        or = orLike(or, all, types, ",voucherIssueStatusCd,", pmVoucherIssue.voucherIssueStatusCd, pattern);
        or = orLike(or, all, types, ",voucherIssueStatusCdBefore,", pmVoucherIssue.voucherIssueStatusCdBefore, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmVoucherIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmVoucherIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucherIssue.voucherIssueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("voucherIssueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucherIssue.voucherIssueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucherIssue.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmVoucherIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucherIssue.voucherIssueId));
        }
        return orders;
    }

    /* 바우처(상품권) 발행 이력 수정 */
    @Override
    public int updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmVoucherIssue);
        boolean hasAny = false;

        if (entity.getVoucherId()                  != null) { update.set(pmVoucherIssue.voucherId,                  entity.getVoucherId());                  hasAny = true; }
        if (entity.getSiteId()                     != null) { update.set(pmVoucherIssue.siteId,                     entity.getSiteId());                     hasAny = true; }
        if (entity.getMemberId()                   != null) { update.set(pmVoucherIssue.memberId,                   entity.getMemberId());                   hasAny = true; }
        if (entity.getVoucherCode()                != null) { update.set(pmVoucherIssue.voucherCode,                entity.getVoucherCode());                hasAny = true; }
        if (entity.getIssueDate()                  != null) { update.set(pmVoucherIssue.issueDate,                  entity.getIssueDate());                  hasAny = true; }
        if (entity.getExpireDate()                 != null) { update.set(pmVoucherIssue.expireDate,                 entity.getExpireDate());                 hasAny = true; }
        if (entity.getUseDate()                    != null) { update.set(pmVoucherIssue.useDate,                    entity.getUseDate());                    hasAny = true; }
        if (entity.getOrderId()                    != null) { update.set(pmVoucherIssue.orderId,                    entity.getOrderId());                    hasAny = true; }
        if (entity.getUseAmt()                     != null) { update.set(pmVoucherIssue.useAmt,                     entity.getUseAmt());                     hasAny = true; }
        if (entity.getVoucherIssueStatusCd()       != null) { update.set(pmVoucherIssue.voucherIssueStatusCd,       entity.getVoucherIssueStatusCd());       hasAny = true; }
        if (entity.getVoucherIssueStatusCdBefore() != null) { update.set(pmVoucherIssue.voucherIssueStatusCdBefore, entity.getVoucherIssueStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                      != null) { update.set(pmVoucherIssue.updBy,                      entity.getUpdBy());                      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmVoucherIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmVoucherIssue.voucherIssueId.eq(entity.getVoucherIssueId())).execute();
        return (int) affected;
    }
}
