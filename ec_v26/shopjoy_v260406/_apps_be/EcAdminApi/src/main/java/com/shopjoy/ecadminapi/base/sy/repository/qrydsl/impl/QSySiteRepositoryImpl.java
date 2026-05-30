package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSySiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SySite QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSySiteRepositoryImpl implements QSySiteRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final QSySite s = QSySite.sySite;
    private static final QSyCode cdSt = new QSyCode("cd_st");
    private static final QSyCode cdSs = new QSyCode("cd_ss");

    /* 사이트 buildBaseQuery */
    private JPAQuery<SySiteDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SySiteDto.Item.class,
                        s.siteId, s.siteCode, s.siteTypeCd, s.siteNm, s.siteDomain,
                        s.logoUrl, s.faviconUrl, s.siteDesc, s.siteEmail, s.sitePhone,
                        s.siteZipCode, s.siteAddress, s.siteBusinessNo, s.siteCeo,
                        s.siteStatusCd, s.configJson,
                        s.regBy, s.regDate, s.updBy, s.updDate, s.pathId,
                        cdSt.codeLabel.as("siteTypeCdNm"),
                        cdSs.codeLabel.as("siteStatusCdNm")
                ))
                .from(s)
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SITE_TYPE").and(cdSt.codeValue.eq(s.siteTypeCd)))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SITE_STATUS").and(cdSs.codeValue.eq(s.siteStatusCd)));
    }

    /* 사이트 키조회 */
    @Override
    public Optional<SySiteDto.Item> selectById(String siteId) {
        SySiteDto.Item dto = buildBaseQuery()
                .where(s.siteId.eq(siteId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사이트 목록조회 */
    @Override
    public List<SySiteDto.Item> selectList(SySiteDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SySiteDto.Item> query = buildBaseQuery().where(
                andSiteId(search),
                andStatus(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 사이트 페이지조회 */
    @Override
    public SySiteDto.PageResponse selectPageList(SySiteDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SySiteDto.Item> query = buildBaseQuery().where(
                andSiteId(search),
                andStatus(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SySiteDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(s.count()).from(s).where(
                andSiteId(search),
                andStatus(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        SySiteDto.PageResponse res = new SySiteDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? s.siteId.eq(search.getSiteId()) : null;
    }

    /* siteStatusCd 정확 일치 */
    private BooleanExpression andStatus(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? s.siteStatusCd.eq(search.getStatus()) : null;
    }

    /* siteTypeCd 정확 일치 */
    private BooleanExpression andTypeCd(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? s.siteTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SySiteDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return s.regDate.goe(start).and(s.regDate.lt(endExcl));
            case "upd_date": return s.updDate.goe(start).and(s.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SySiteDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",configJson,", s.configJson, pattern);
        or = orLike(or, all, types, ",faviconUrl,", s.faviconUrl, pattern);
        or = orLike(or, all, types, ",logoUrl,", s.logoUrl, pattern);
        or = orLike(or, all, types, ",pathId,", s.pathId, pattern);
        or = orLike(or, all, types, ",siteAddress,", s.siteAddress, pattern);
        or = orLike(or, all, types, ",siteBusinessNo,", s.siteBusinessNo, pattern);
        or = orLike(or, all, types, ",siteCeo,", s.siteCeo, pattern);
        or = orLike(or, all, types, ",siteCode,", s.siteCode, pattern);
        or = orLike(or, all, types, ",siteDesc,", s.siteDesc, pattern);
        or = orLike(or, all, types, ",siteDomain,", s.siteDomain, pattern);
        or = orLike(or, all, types, ",siteEmail,", s.siteEmail, pattern);
        or = orLike(or, all, types, ",siteId,", s.siteId, pattern);
        or = orLike(or, all, types, ",siteNm,", s.siteNm, pattern);
        or = orLike(or, all, types, ",sitePhone,", s.sitePhone, pattern);
        or = orLike(or, all, types, ",siteStatusCd,", s.siteStatusCd, pattern);
        or = orLike(or, all, types, ",siteTypeCd,", s.siteTypeCd, pattern);
        or = orLike(or, all, types, ",siteZipCode,", s.siteZipCode, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SySiteDto.Request q) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = q == null ? null : q.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.siteId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("siteId".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.siteId));
                } else if ("siteNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.siteNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.siteId));
        }
        return orders;
    }

    /* 사이트 수정 */
    @Override
    public int updateSelective(SySite entity) {
        if (entity.getSiteId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteCode()       != null) { update.set(s.siteCode,       entity.getSiteCode());       hasAny = true; }
        if (entity.getSiteTypeCd()     != null) { update.set(s.siteTypeCd,     entity.getSiteTypeCd());     hasAny = true; }
        if (entity.getSiteNm()         != null) { update.set(s.siteNm,         entity.getSiteNm());         hasAny = true; }
        if (entity.getSiteDomain()     != null) { update.set(s.siteDomain,     entity.getSiteDomain());     hasAny = true; }
        if (entity.getLogoUrl()        != null) { update.set(s.logoUrl,        entity.getLogoUrl());        hasAny = true; }
        if (entity.getFaviconUrl()     != null) { update.set(s.faviconUrl,     entity.getFaviconUrl());     hasAny = true; }
        if (entity.getSiteDesc()       != null) { update.set(s.siteDesc,       entity.getSiteDesc());       hasAny = true; }
        if (entity.getSiteEmail()      != null) { update.set(s.siteEmail,      entity.getSiteEmail());      hasAny = true; }
        if (entity.getSitePhone()      != null) { update.set(s.sitePhone,      entity.getSitePhone());      hasAny = true; }
        if (entity.getSiteZipCode()    != null) { update.set(s.siteZipCode,    entity.getSiteZipCode());    hasAny = true; }
        if (entity.getSiteAddress()    != null) { update.set(s.siteAddress,    entity.getSiteAddress());    hasAny = true; }
        if (entity.getSiteBusinessNo() != null) { update.set(s.siteBusinessNo, entity.getSiteBusinessNo()); hasAny = true; }
        if (entity.getSiteCeo()        != null) { update.set(s.siteCeo,        entity.getSiteCeo());        hasAny = true; }
        if (entity.getSiteStatusCd()   != null) { update.set(s.siteStatusCd,   entity.getSiteStatusCd());   hasAny = true; }
        if (entity.getConfigJson()     != null) { update.set(s.configJson,     entity.getConfigJson());     hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(s.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(s.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()         != null) { update.set(s.pathId,         entity.getPathId());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.siteId.eq(entity.getSiteId())).execute();
        return (int) affected;
    }
}
