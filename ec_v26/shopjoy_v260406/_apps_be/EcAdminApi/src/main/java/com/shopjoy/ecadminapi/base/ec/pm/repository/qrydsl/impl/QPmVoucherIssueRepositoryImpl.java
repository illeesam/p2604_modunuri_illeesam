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
    private static final QPmVoucherIssue a    = QPmVoucherIssue.pmVoucherIssue;
    private static final QPmVoucher      vou  = QPmVoucher.pmVoucher;
    private static final QOdOrder        ord  = QOdOrder.odOrder;
    private static final QSySite         ste  = QSySite.sySite;
    private static final QSyCode         cdVis = new QSyCode("cd_vis");

    /* 바우처(상품권) 발행 이력 baseSelColumnQuery */
    private JPAQuery<PmVoucherIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherIssueDto.Item.class,
                        a.voucherIssueId, a.voucherId, a.siteId, a.memberId, a.voucherCode,
                        a.issueDate, a.expireDate, a.useDate, a.orderId, a.useAmt,
                        a.voucherIssueStatusCd, a.voucherIssueStatusCdBefore,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(vou).on(vou.voucherId.eq(a.voucherId))
                .leftJoin(ord).on(ord.orderId.eq(a.orderId))
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdVis).on(cdVis.codeGrp.eq("VOUCHER_ISSUE_STATUS").and(cdVis.codeValue.eq(a.voucherIssueStatusCd)));
    }

    /* 바우처(상품권) 발행 이력 키조회 */
    @Override
    public Optional<PmVoucherIssueDto.Item> selectById(String voucherIssueId) {
        PmVoucherIssueDto.Item dto = baseSelColumnQuery()
                .where(a.voucherIssueId.eq(voucherIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 발행 이력 목록조회 */
    @Override
    public List<PmVoucherIssueDto.Item> selectList(PmVoucherIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery().where(
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
    public PmVoucherIssueDto.PageResponse selectPageList(PmVoucherIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndVoucherIssueId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmVoucherIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndVoucherIssueId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
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
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* voucherIssueId 정확 일치 */
    private BooleanExpression baseAndVoucherIssueId(PmVoucherIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getVoucherIssueId())
                ? a.voucherIssueId.eq(search.getVoucherIssueId()) : null;
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
            case "issue_date": return a.issueDate.goe(start).and(a.issueDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",voucherCode,", a.voucherCode, pattern);
        or = orLike(or, all, types, ",voucherId,", a.voucherId, pattern);
        or = orLike(or, all, types, ",voucherIssueId,", a.voucherIssueId, pattern);
        or = orLike(or, all, types, ",voucherIssueStatusCd,", a.voucherIssueStatusCd, pattern);
        or = orLike(or, all, types, ",voucherIssueStatusCdBefore,", a.voucherIssueStatusCdBefore, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.voucherIssueId));
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
                    orders.add(new OrderSpecifier(order, a.voucherIssueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.voucherIssueId));
        }
        return orders;
    }

    /* 바우처(상품권) 발행 이력 수정 */
    @Override
    public int updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getVoucherId()                  != null) { update.set(a.voucherId,                  entity.getVoucherId());                  hasAny = true; }
        if (entity.getSiteId()                     != null) { update.set(a.siteId,                     entity.getSiteId());                     hasAny = true; }
        if (entity.getMemberId()                   != null) { update.set(a.memberId,                   entity.getMemberId());                   hasAny = true; }
        if (entity.getVoucherCode()                != null) { update.set(a.voucherCode,                entity.getVoucherCode());                hasAny = true; }
        if (entity.getIssueDate()                  != null) { update.set(a.issueDate,                  entity.getIssueDate());                  hasAny = true; }
        if (entity.getExpireDate()                 != null) { update.set(a.expireDate,                 entity.getExpireDate());                 hasAny = true; }
        if (entity.getUseDate()                    != null) { update.set(a.useDate,                    entity.getUseDate());                    hasAny = true; }
        if (entity.getOrderId()                    != null) { update.set(a.orderId,                    entity.getOrderId());                    hasAny = true; }
        if (entity.getUseAmt()                     != null) { update.set(a.useAmt,                     entity.getUseAmt());                     hasAny = true; }
        if (entity.getVoucherIssueStatusCd()       != null) { update.set(a.voucherIssueStatusCd,       entity.getVoucherIssueStatusCd());       hasAny = true; }
        if (entity.getVoucherIssueStatusCdBefore() != null) { update.set(a.voucherIssueStatusCdBefore, entity.getVoucherIssueStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                      != null) { update.set(a.updBy,                      entity.getUpdBy());                      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.voucherIssueId.eq(entity.getVoucherIssueId())).execute();
        return (int) affected;
    }
}
