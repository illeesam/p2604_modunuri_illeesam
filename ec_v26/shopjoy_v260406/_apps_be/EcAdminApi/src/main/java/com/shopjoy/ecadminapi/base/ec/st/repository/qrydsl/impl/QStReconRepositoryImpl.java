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
    private static final QStRecon     stRecon    = QStRecon.stRecon;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QSyVendor    syVendor  = QSyVendor.syVendor;
    private static final QStSettleRaw stSettleRaw  = QStSettleRaw.stSettleRaw;
    private static final QSyCode      cdRt = new QSyCode("cd_rt");
    private static final QSyCode      cdRs = new QSyCode("cd_rs");

    /* 정산 대사(Reconciliation) 키조회 */
    @Override
    public Optional<StReconDto.Item> selectById(String id) {
        StReconDto.Item dto = baseListQuery()
                .where(stRecon.reconId.eq(id))
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
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndReconId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<StReconDto.Item> query = baseListQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StReconDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(stRecon.count())
                .from(stRecon)
                .where(wheres)
                .fetchOne();

        StReconDto.PageResponse res = new StReconDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 대사(Reconciliation) baseListQuery */
    private JPAQuery<StReconDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StReconDto.Item.class,
                        stRecon.reconId, stRecon.siteId, stRecon.vendorId, stRecon.reconTypeCd,
                        stRecon.reconStatusCd, stRecon.reconStatusCdBefore, stRecon.settleId, stRecon.settleRawId,
                        stRecon.refId, stRecon.refNo, stRecon.settlePeriod,
                        stRecon.expectedAmt, stRecon.actualAmt, stRecon.diffAmt, stRecon.reconNote,
                        stRecon.resolvedBy, stRecon.resolvedDate,
                        stRecon.regBy, stRecon.regDate, stRecon.updBy, stRecon.updDate,
                        sySite.siteNm.as("siteNm"),
                        syVendor.vendorNm.as("vendorNm"),
                        stSettleRaw.prodNm.as("settleRawNm"),
                        cdRt.codeLabel.as("reconTypeCdNm"),
                        cdRs.codeLabel.as("reconStatusCdNm")
                ))
                .from(stRecon)
                .leftJoin(sySite).on(sySite.siteId.eq(stRecon.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stRecon.vendorId))
                .leftJoin(stSettleRaw).on(stSettleRaw.settleRawId.eq(stRecon.settleRawId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RECON_TYPE").and(cdRt.codeValue.eq(stRecon.reconTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RECON_STATUS").and(cdRs.codeValue.eq(stRecon.reconStatusCd)));
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
                ? stRecon.siteId.eq(search.getSiteId()) : null;
    }

    /* reconId 정확 일치 */
    private BooleanExpression baseAndReconId(StReconDto.Request search) {
        return search != null && StringUtils.hasText(search.getReconId())
                ? stRecon.reconId.eq(search.getReconId()) : null;
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
            case "reg_date": return stRecon.regDate.goe(start).and(stRecon.regDate.lt(endExcl));
            case "upd_date": return stRecon.updDate.goe(start).and(stRecon.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",reconId,", stRecon.reconId, pattern);
        or = orLike(or, all, types, ",reconNote,", stRecon.reconNote, pattern);
        or = orLike(or, all, types, ",reconStatusCd,", stRecon.reconStatusCd, pattern);
        or = orLike(or, all, types, ",reconStatusCdBefore,", stRecon.reconStatusCdBefore, pattern);
        or = orLike(or, all, types, ",reconTypeCd,", stRecon.reconTypeCd, pattern);
        or = orLike(or, all, types, ",refId,", stRecon.refId, pattern);
        or = orLike(or, all, types, ",refNo,", stRecon.refNo, pattern);
        or = orLike(or, all, types, ",resolvedBy,", stRecon.resolvedBy, pattern);
        or = orLike(or, all, types, ",settleId,", stRecon.settleId, pattern);
        or = orLike(or, all, types, ",settlePeriod,", stRecon.settlePeriod, pattern);
        or = orLike(or, all, types, ",settleRawId,", stRecon.settleRawId, pattern);
        or = orLike(or, all, types, ",siteId,", stRecon.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", stRecon.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, stRecon.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stRecon.reconId));
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
                    orders.add(new OrderSpecifier(order, stRecon.reconId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stRecon.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stRecon.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stRecon.reconId));
        }
        return orders;
    }

    /* 정산 대사(Reconciliation) 수정 */
    @Override
    public int updateSelective(StRecon entity) {
        if (entity.getReconId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stRecon);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(stRecon.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(stRecon.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getReconTypeCd()         != null) { update.set(stRecon.reconTypeCd,         entity.getReconTypeCd());         hasAny = true; }
        if (entity.getReconStatusCd()       != null) { update.set(stRecon.reconStatusCd,       entity.getReconStatusCd());       hasAny = true; }
        if (entity.getReconStatusCdBefore() != null) { update.set(stRecon.reconStatusCdBefore, entity.getReconStatusCdBefore()); hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(stRecon.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getSettleRawId()         != null) { update.set(stRecon.settleRawId,         entity.getSettleRawId());         hasAny = true; }
        if (entity.getRefId()               != null) { update.set(stRecon.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getRefNo()               != null) { update.set(stRecon.refNo,               entity.getRefNo());               hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(stRecon.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getExpectedAmt()         != null) { update.set(stRecon.expectedAmt,         entity.getExpectedAmt());         hasAny = true; }
        if (entity.getActualAmt()           != null) { update.set(stRecon.actualAmt,           entity.getActualAmt());           hasAny = true; }
        if (entity.getDiffAmt()             != null) { update.set(stRecon.diffAmt,             entity.getDiffAmt());             hasAny = true; }
        if (entity.getReconNote()           != null) { update.set(stRecon.reconNote,           entity.getReconNote());           hasAny = true; }
        if (entity.getResolvedBy()          != null) { update.set(stRecon.resolvedBy,          entity.getResolvedBy());          hasAny = true; }
        if (entity.getResolvedDate()        != null) { update.set(stRecon.resolvedDate,        entity.getResolvedDate());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(stRecon.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stRecon.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stRecon.reconId.eq(entity.getReconId())).execute();
        return (int) affected;
    }
}
