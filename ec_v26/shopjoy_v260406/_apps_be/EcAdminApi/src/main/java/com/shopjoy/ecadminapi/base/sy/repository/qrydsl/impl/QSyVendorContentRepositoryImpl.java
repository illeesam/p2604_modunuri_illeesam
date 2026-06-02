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
    private static final QSyVendorContent syVendorContent = QSyVendorContent.syVendorContent;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyAttachGrp syAttachGrp = QSyAttachGrp.syAttachGrp;
    private static final QSyCode cdVct = new QSyCode("cd_vct");
    private static final QSyCode cdVcs = new QSyCode("cd_vcs");

    /* 업체 콘텐츠 baseSelColumnQuery */
    private JPAQuery<SyVendorContentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorContentDto.Item.class,
                        syVendorContent.vendorContentId, syVendorContent.siteId, syVendorContent.vendorId, syVendorContent.contentTypeCd,
                        syVendorContent.vendorContentTitle, syVendorContent.vendorContentSubtitle, syVendorContent.contentHtml,
                        syVendorContent.thumbUrl, syVendorContent.imageUrl, syVendorContent.linkUrl, syVendorContent.attachGrpId, syVendorContent.langCd,
                        syVendorContent.startDate, syVendorContent.endDate, syVendorContent.sortOrd,
                        syVendorContent.vendorContentStatusCd, syVendorContent.useYn, syVendorContent.viewCount, syVendorContent.vendorContentRemark,
                        syVendorContent.regBy, syVendorContent.regDate, syVendorContent.updBy, syVendorContent.updDate,
                        syVendor.vendorNm.as("vendorNm")
                ))
                .from(syVendorContent)
                .leftJoin(sySite).on(sySite.siteId.eq(syVendorContent.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syVendorContent.vendorId))
                .leftJoin(syAttachGrp).on(syAttachGrp.attachGrpId.eq(syVendorContent.attachGrpId))
                .leftJoin(cdVct).on(cdVct.codeGrp.eq("VENDOR_CONTENT_TYPE").and(cdVct.codeValue.eq(syVendorContent.contentTypeCd)))
                .leftJoin(cdVcs).on(cdVcs.codeGrp.eq("VENDOR_CONTENT_STATUS").and(cdVcs.codeValue.eq(syVendorContent.vendorContentStatusCd)));
    }

    /* 업체 콘텐츠 키조회 */
    @Override
    public Optional<SyVendorContentDto.Item> selectById(String vendorContentId) {
        SyVendorContentDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorContent.vendorContentId.eq(vendorContentId))
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

        Long total = queryFactory.select(syVendorContent.count()).from(syVendorContent).where(
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
                ? syVendorContent.siteId.eq(search.getSiteId()) : null;
    }

    /* vendorContentId 정확 일치 */
    private BooleanExpression baseAndVendorContentId(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorContentId())
                ? syVendorContent.vendorContentId.eq(search.getVendorContentId()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? syVendorContent.vendorId.eq(search.getVendorId()) : null;
    }

    /* vendorContentStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? syVendorContent.vendorContentStatusCd.eq(search.getStatus()) : null;
    }

    /* contentTypeCd 정확 일치 */
    private BooleanExpression baseAndContentTypeCd(SyVendorContentDto.Request search) {
        return search != null && StringUtils.hasText(search.getContentTypeCd())
                ? syVendorContent.contentTypeCd.eq(search.getContentTypeCd()) : null;
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
            case "reg_date": return syVendorContent.regDate.goe(start).and(syVendorContent.regDate.lt(endExcl));
            case "upd_date": return syVendorContent.updDate.goe(start).and(syVendorContent.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",attachGrpId,", syVendorContent.attachGrpId, pattern);
        or = orLike(or, all, types, ",contentHtml,", syVendorContent.contentHtml, pattern);
        or = orLike(or, all, types, ",contentTypeCd,", syVendorContent.contentTypeCd, pattern);
        or = orLike(or, all, types, ",imageUrl,", syVendorContent.imageUrl, pattern);
        or = orLike(or, all, types, ",langCd,", syVendorContent.langCd, pattern);
        or = orLike(or, all, types, ",linkUrl,", syVendorContent.linkUrl, pattern);
        or = orLike(or, all, types, ",siteId,", syVendorContent.siteId, pattern);
        or = orLike(or, all, types, ",thumbUrl,", syVendorContent.thumbUrl, pattern);
        or = orLike(or, all, types, ",useYn,", syVendorContent.useYn, pattern);
        or = orLike(or, all, types, ",vendorContentId,", syVendorContent.vendorContentId, pattern);
        or = orLike(or, all, types, ",vendorContentRemark,", syVendorContent.vendorContentRemark, pattern);
        or = orLike(or, all, types, ",vendorContentStatusCd,", syVendorContent.vendorContentStatusCd, pattern);
        or = orLike(or, all, types, ",vendorContentSubtitle,", syVendorContent.vendorContentSubtitle, pattern);
        or = orLike(or, all, types, ",vendorContentTitle,", syVendorContent.vendorContentTitle, pattern);
        or = orLike(or, all, types, ",vendorId,", syVendorContent.vendorId, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorContent.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorContent.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorContent.vendorContentId));

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
                    orders.add(new OrderSpecifier(order, syVendorContent.vendorContentId));
                } else if ("vendorContentTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorContent.vendorContentTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorContent.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syVendorContent.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorContent.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorContent.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorContent.vendorContentId));
        }
        return orders;
    }

    /* 업체 콘텐츠 수정 */
    @Override
    public int updateSelective(SyVendorContent entity) {
        if (entity.getVendorContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorContent);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(syVendorContent.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVendorId()              != null) { update.set(syVendorContent.vendorId,              entity.getVendorId());              hasAny = true; }
        if (entity.getContentTypeCd()         != null) { update.set(syVendorContent.contentTypeCd,         entity.getContentTypeCd());         hasAny = true; }
        if (entity.getVendorContentTitle()    != null) { update.set(syVendorContent.vendorContentTitle,    entity.getVendorContentTitle());    hasAny = true; }
        if (entity.getVendorContentSubtitle() != null) { update.set(syVendorContent.vendorContentSubtitle, entity.getVendorContentSubtitle()); hasAny = true; }
        if (entity.getContentHtml()           != null) { update.set(syVendorContent.contentHtml,           entity.getContentHtml());           hasAny = true; }
        if (entity.getThumbUrl()              != null) { update.set(syVendorContent.thumbUrl,              entity.getThumbUrl());              hasAny = true; }
        if (entity.getImageUrl()              != null) { update.set(syVendorContent.imageUrl,              entity.getImageUrl());              hasAny = true; }
        if (entity.getLinkUrl()               != null) { update.set(syVendorContent.linkUrl,               entity.getLinkUrl());               hasAny = true; }
        if (entity.getAttachGrpId()           != null) { update.set(syVendorContent.attachGrpId,           entity.getAttachGrpId());           hasAny = true; }
        if (entity.getLangCd()                != null) { update.set(syVendorContent.langCd,                entity.getLangCd());                hasAny = true; }
        if (entity.getStartDate()             != null) { update.set(syVendorContent.startDate,             entity.getStartDate());             hasAny = true; }
        if (entity.getEndDate()               != null) { update.set(syVendorContent.endDate,               entity.getEndDate());               hasAny = true; }
        if (entity.getSortOrd()               != null) { update.set(syVendorContent.sortOrd,               entity.getSortOrd());               hasAny = true; }
        if (entity.getVendorContentStatusCd() != null) { update.set(syVendorContent.vendorContentStatusCd, entity.getVendorContentStatusCd()); hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(syVendorContent.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getViewCount()             != null) { update.set(syVendorContent.viewCount,             entity.getViewCount());             hasAny = true; }
        if (entity.getVendorContentRemark()   != null) { update.set(syVendorContent.vendorContentRemark,   entity.getVendorContentRemark());   hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(syVendorContent.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syVendorContent.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorContent.vendorContentId.eq(entity.getVendorContentId())).execute();
        return (int) affected;
    }
}
