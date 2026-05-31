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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveIssueRepository;
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
/** PmSaveIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveIssueRepositoryImpl implements QPmSaveIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveIssueRepositoryImpl";
    private static final QPmSaveIssue i    = QPmSaveIssue.pmSaveIssue;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QOdOrder     ord  = QOdOrder.odOrder;
    private static final QOdOrderItem ite  = QOdOrderItem.odOrderItem;
    private static final QPdProd      prd  = QPdProd.pdProd;
    private static final QSyCode      cdSit = new QSyCode("cd_sit");
    private static final QSyCode      cdSis = new QSyCode("cd_sis");

    /* 적립금 지급 이력 baseQuery */
    private JPAQuery<PmSaveIssueDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveIssueDto.Item.class,
                        i.saveIssueId, i.siteId, i.memberId, i.saveIssueTypeCd, i.saveAmt,
                        i.saveRate, i.refTypeCd, i.refId, i.orderId, i.orderItemId, i.prodId,
                        i.expireDate, i.issueStatusCd, i.issueStatusCdBefore, i.saveMemo,
                        i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(mem).on(mem.memberId.eq(i.memberId))
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(i.orderItemId))
                .leftJoin(prd).on(prd.prodId.eq(i.prodId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SAVE_ISSUE_TYPE").and(cdSit.codeValue.eq(i.saveIssueTypeCd)))
                .leftJoin(cdSis).on(cdSis.codeGrp.eq("SAVE_ISSUE_STATUS").and(cdSis.codeValue.eq(i.issueStatusCd)));
    }

    /* 적립금 지급 이력 키조회 */
    @Override
    public Optional<PmSaveIssueDto.Item> selectById(String saveIssueId) {
        PmSaveIssueDto.Item dto = baseQuery()
                .where(i.saveIssueId.eq(saveIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 지급 이력 목록조회 */
    @Override
    public List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveIssueDto.Item> query = baseQuery().where(
                andSiteId(search),
                andSaveIssueId(search),
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

    /* 적립금 지급 이력 페이지조회 */
    @Override
    public PmSaveIssueDto.PageResponse selectPageList(PmSaveIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveIssueDto.Item> query = baseQuery().where(
                andSiteId(search),
                andSaveIssueId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(
                andSiteId(search),
                andSaveIssueId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmSaveIssueDto.PageResponse res = new PmSaveIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 지급 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmSaveIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? i.siteId.eq(search.getSiteId()) : null;
    }

    /* saveIssueId 정확 일치 */
    private BooleanExpression andSaveIssueId(PmSaveIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getSaveIssueId())
                ? i.saveIssueId.eq(search.getSaveIssueId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmSaveIssueDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return i.regDate.goe(start).and(i.regDate.lt(endExcl));
            case "upd_date": return i.updDate.goe(start).and(i.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmSaveIssueDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",issueStatusCd,", i.issueStatusCd, pattern);
        or = orLike(or, all, types, ",issueStatusCdBefore,", i.issueStatusCdBefore, pattern);
        or = orLike(or, all, types, ",memberId,", i.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", i.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", i.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", i.prodId, pattern);
        or = orLike(or, all, types, ",refId,", i.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", i.refTypeCd, pattern);
        or = orLike(or, all, types, ",saveIssueId,", i.saveIssueId, pattern);
        or = orLike(or, all, types, ",saveIssueTypeCd,", i.saveIssueTypeCd, pattern);
        or = orLike(or, all, types, ",saveMemo,", i.saveMemo, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmSaveIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.saveIssueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("saveIssueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.saveIssueId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.saveIssueId));
        }
        return orders;
    }

    /* 적립금 지급 이력 수정 */
    @Override
    public int updateSelective(PmSaveIssue entity) {
        if (entity.getSaveIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(i.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(i.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getSaveIssueTypeCd()     != null) { update.set(i.saveIssueTypeCd,     entity.getSaveIssueTypeCd());     hasAny = true; }
        if (entity.getSaveAmt()             != null) { update.set(i.saveAmt,             entity.getSaveAmt());             hasAny = true; }
        if (entity.getSaveRate()            != null) { update.set(i.saveRate,            entity.getSaveRate());            hasAny = true; }
        if (entity.getRefTypeCd()           != null) { update.set(i.refTypeCd,           entity.getRefTypeCd());           hasAny = true; }
        if (entity.getRefId()               != null) { update.set(i.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(i.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderItemId()         != null) { update.set(i.orderItemId,         entity.getOrderItemId());         hasAny = true; }
        if (entity.getProdId()              != null) { update.set(i.prodId,              entity.getProdId());              hasAny = true; }
        if (entity.getExpireDate()          != null) { update.set(i.expireDate,          entity.getExpireDate());          hasAny = true; }
        if (entity.getIssueStatusCd()       != null) { update.set(i.issueStatusCd,       entity.getIssueStatusCd());       hasAny = true; }
        if (entity.getIssueStatusCdBefore() != null) { update.set(i.issueStatusCdBefore, entity.getIssueStatusCdBefore()); hasAny = true; }
        if (entity.getSaveMemo()            != null) { update.set(i.saveMemo,            entity.getSaveMemo());            hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(i.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(i.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(i.saveIssueId.eq(entity.getSaveIssueId())).execute();
        return (int) affected;
    }
}
