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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorContent;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyVendorContent QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorContentRepositoryImpl implements QSyVendorContentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorContentRepositoryImpl";
    private static final QSyVendorContent a = QSyVendorContent.syVendorContent;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyAttachGrp atg = QSyAttachGrp.syAttachGrp;
    private static final QSyCode cdVct = new QSyCode("cd_vct");
    private static final QSyCode cdVcs = new QSyCode("cd_vcs");

    /* 업체 콘텐츠 baseSelColumnQuery */
    private JPAQuery<SyVendorContentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorContentDto.Item.class,
                        a.vendorContentId, a.siteId, a.vendorId, a.contentTypeCd,
                        a.vendorContentTitle, a.vendorContentSubtitle, a.contentHtml,
                        a.thumbUrl, a.imageUrl, a.linkUrl, a.attachGrpId, a.langCd,
                        a.startDate, a.endDate, a.sortOrd,
                        a.vendorContentStatusCd, a.useYn, a.viewCount, a.vendorContentRemark,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        vnd.vendorNm.as("vendorNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(a.vendorId))
                .leftJoin(atg).on(atg.attachGrpId.eq(a.attachGrpId))
                .leftJoin(cdVct).on(cdVct.codeGrp.eq("VENDOR_CONTENT_TYPE").and(cdVct.codeValue.eq(a.contentTypeCd)))
                .leftJoin(cdVcs).on(cdVcs.codeGrp.eq("VENDOR_CONTENT_STATUS").and(cdVcs.codeValue.eq(a.vendorContentStatusCd)));
    }

    /* 업체 콘텐츠 키조회 */
    @Override
    public Optional<SyVendorContentDto.Item> selectById(String vendorContentId) {
        SyVendorContentDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.vendorContentId.eq(vendorContentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체 콘텐츠 목록조회 */
    @Override
    public List<SyVendorContentDto.Item> selectList(SyVendorContentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorContentDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndVendorContentId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndContentTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 업체 콘텐츠 페이지조회 */
    @Override
    public SyVendorContentDto.PageResponse selectPageData(SyVendorContentDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorContentDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndSiteId(search),
                baseAndVendorContentId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndContentTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorContentDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndVendorContentId(search),
                baseAndVendorId(search),
                baseAndStatus(search),
                baseAndContentTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyVendorContentDto.PageResponse res = new SyVendorContentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* vendorContentId 정확 일치 */
    private BooleanExpression baseAndVendorContentId(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorContentId())
                ? a.vendorContentId.eq(search.getVendorContentId()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? a.vendorId.eq(search.getVendorId()) : null;
    }

    /* vendorContentStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? a.vendorContentStatusCd.eq(search.getStatus()) : null;
    }

    /* contentTypeCd 정확 일치 */
    private BooleanExpression baseAndContentTypeCd(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getContentTypeCd())
                ? a.contentTypeCd.eq(search.getContentTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyVendorContentDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(SyVendorContentDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachGrpId,", a.attachGrpId, pattern);
        or = orLike(or, all, types, ",contentHtml,", a.contentHtml, pattern);
        or = orLike(or, all, types, ",contentTypeCd,", a.contentTypeCd, pattern);
        or = orLike(or, all, types, ",imageUrl,", a.imageUrl, pattern);
        or = orLike(or, all, types, ",langCd,", a.langCd, pattern);
        or = orLike(or, all, types, ",linkUrl,", a.linkUrl, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",thumbUrl,", a.thumbUrl, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
        or = orLike(or, all, types, ",vendorContentId,", a.vendorContentId, pattern);
        or = orLike(or, all, types, ",vendorContentRemark,", a.vendorContentRemark, pattern);
        or = orLike(or, all, types, ",vendorContentStatusCd,", a.vendorContentStatusCd, pattern);
        or = orLike(or, all, types, ",vendorContentSubtitle,", a.vendorContentSubtitle, pattern);
        or = orLike(or, all, types, ",vendorContentTitle,", a.vendorContentTitle, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyVendorContentDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.vendorContentId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorContentId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.vendorContentId));
                } else if ("vendorContentTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.vendorContentTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, a.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.vendorContentId));
        }
        return orders;
    }

    /* 업체 콘텐츠 수정 */
    @Override
    public int updateSelective(SyVendorContent entity) {
        if (entity.getVendorContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(a.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVendorId()              != null) { update.set(a.vendorId,              entity.getVendorId());              hasAny = true; }
        if (entity.getContentTypeCd()         != null) { update.set(a.contentTypeCd,         entity.getContentTypeCd());         hasAny = true; }
        if (entity.getVendorContentTitle()    != null) { update.set(a.vendorContentTitle,    entity.getVendorContentTitle());    hasAny = true; }
        if (entity.getVendorContentSubtitle() != null) { update.set(a.vendorContentSubtitle, entity.getVendorContentSubtitle()); hasAny = true; }
        if (entity.getContentHtml()           != null) { update.set(a.contentHtml,           entity.getContentHtml());           hasAny = true; }
        if (entity.getThumbUrl()              != null) { update.set(a.thumbUrl,              entity.getThumbUrl());              hasAny = true; }
        if (entity.getImageUrl()              != null) { update.set(a.imageUrl,              entity.getImageUrl());              hasAny = true; }
        if (entity.getLinkUrl()               != null) { update.set(a.linkUrl,               entity.getLinkUrl());               hasAny = true; }
        if (entity.getAttachGrpId()           != null) { update.set(a.attachGrpId,           entity.getAttachGrpId());           hasAny = true; }
        if (entity.getLangCd()                != null) { update.set(a.langCd,                entity.getLangCd());                hasAny = true; }
        if (entity.getStartDate()             != null) { update.set(a.startDate,             entity.getStartDate());             hasAny = true; }
        if (entity.getEndDate()               != null) { update.set(a.endDate,               entity.getEndDate());               hasAny = true; }
        if (entity.getSortOrd()               != null) { update.set(a.sortOrd,               entity.getSortOrd());               hasAny = true; }
        if (entity.getVendorContentStatusCd() != null) { update.set(a.vendorContentStatusCd, entity.getVendorContentStatusCd()); hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(a.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getViewCount()             != null) { update.set(a.viewCount,             entity.getViewCount());             hasAny = true; }
        if (entity.getVendorContentRemark()   != null) { update.set(a.vendorContentRemark,   entity.getVendorContentRemark());   hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(a.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.vendorContentId.eq(entity.getVendorContentId())).execute();
        return (int) affected;
    }
}
