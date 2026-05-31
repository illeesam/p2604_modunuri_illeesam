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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStRecon;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStReconRepository;
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
/** StRecon QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStReconRepositoryImpl implements QStReconRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStReconRepositoryImpl";
    private static final QStRecon     a    = QStRecon.stRecon;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QSyVendor    vnd  = QSyVendor.syVendor;
    private static final QStSettleRaw raw  = QStSettleRaw.stSettleRaw;
    private static final QSyCode      cdRt = new QSyCode("cd_rt");
    private static final QSyCode      cdRs = new QSyCode("cd_rs");

    /* 정산 대사(Reconciliation) 키조회 */
    @Override
    public Optional<StReconDto.Item> selectById(String id) {
        StReconDto.Item dto = baseListQuery()
                .where(a.reconId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 대사(Reconciliation) 목록조회 */
    @Override
    public List<StReconDto.Item> selectList(StReconDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StReconDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndReconId(search),
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

    /* 정산 대사(Reconciliation) 페이지조회 */
    @Override
    public StReconDto.PageResponse selectPageData(StReconDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StReconDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndReconId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StReconDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndReconId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        StReconDto.PageResponse res = new StReconDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 대사(Reconciliation) baseListQuery */
    private JPAQuery<StReconDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StReconDto.Item.class,
                        a.reconId, a.siteId, a.vendorId, a.reconTypeCd,
                        a.reconStatusCd, a.reconStatusCdBefore, a.settleId, a.settleRawId,
                        a.refId, a.refNo, a.settlePeriod,
                        a.expectedAmt, a.actualAmt, a.diffAmt, a.reconNote,
                        a.resolvedBy, a.resolvedDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        vnd.vendorNm.as("vendorNm"),
                        raw.prodNm.as("settleRawNm"),
                        cdRt.codeLabel.as("reconTypeCdNm"),
                        cdRs.codeLabel.as("reconStatusCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(a.vendorId))
                .leftJoin(raw).on(raw.settleRawId.eq(a.settleRawId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RECON_TYPE").and(cdRt.codeValue.eq(a.reconTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RECON_STATUS").and(cdRs.codeValue.eq(a.reconStatusCd)));
    }

    /* 정산 대사(Reconciliation) buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(StReconDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* reconId 정확 일치 */
    private BooleanExpression baseAndReconId(StReconDto.Request search) {
        return search != null && StringUtils.hasText(search.getReconId())
                ? a.reconId.eq(search.getReconId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(StReconDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(StReconDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",reconId,", a.reconId, pattern);
        or = orLike(or, all, types, ",reconNote,", a.reconNote, pattern);
        or = orLike(or, all, types, ",reconStatusCd,", a.reconStatusCd, pattern);
        or = orLike(or, all, types, ",reconStatusCdBefore,", a.reconStatusCdBefore, pattern);
        or = orLike(or, all, types, ",reconTypeCd,", a.reconTypeCd, pattern);
        or = orLike(or, all, types, ",refId,", a.refId, pattern);
        or = orLike(or, all, types, ",refNo,", a.refNo, pattern);
        or = orLike(or, all, types, ",resolvedBy,", a.resolvedBy, pattern);
        or = orLike(or, all, types, ",settleId,", a.settleId, pattern);
        or = orLike(or, all, types, ",settlePeriod,", a.settlePeriod, pattern);
        or = orLike(or, all, types, ",settleRawId,", a.settleRawId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StReconDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.reconId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("reconId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.reconId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.reconId));
        }
        return orders;
    }

    /* 정산 대사(Reconciliation) 수정 */
    @Override
    public int updateSelective(StRecon entity) {
        if (entity.getReconId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(a.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(a.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getReconTypeCd()         != null) { update.set(a.reconTypeCd,         entity.getReconTypeCd());         hasAny = true; }
        if (entity.getReconStatusCd()       != null) { update.set(a.reconStatusCd,       entity.getReconStatusCd());       hasAny = true; }
        if (entity.getReconStatusCdBefore() != null) { update.set(a.reconStatusCdBefore, entity.getReconStatusCdBefore()); hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(a.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getSettleRawId()         != null) { update.set(a.settleRawId,         entity.getSettleRawId());         hasAny = true; }
        if (entity.getRefId()               != null) { update.set(a.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getRefNo()               != null) { update.set(a.refNo,               entity.getRefNo());               hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(a.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getExpectedAmt()         != null) { update.set(a.expectedAmt,         entity.getExpectedAmt());         hasAny = true; }
        if (entity.getActualAmt()           != null) { update.set(a.actualAmt,           entity.getActualAmt());           hasAny = true; }
        if (entity.getDiffAmt()             != null) { update.set(a.diffAmt,             entity.getDiffAmt());             hasAny = true; }
        if (entity.getReconNote()           != null) { update.set(a.reconNote,           entity.getReconNote());           hasAny = true; }
        if (entity.getResolvedBy()          != null) { update.set(a.resolvedBy,          entity.getResolvedBy());          hasAny = true; }
        if (entity.getResolvedDate()        != null) { update.set(a.resolvedDate,        entity.getResolvedDate());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(a.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.reconId.eq(entity.getReconId())).execute();
        return (int) affected;
    }
}
