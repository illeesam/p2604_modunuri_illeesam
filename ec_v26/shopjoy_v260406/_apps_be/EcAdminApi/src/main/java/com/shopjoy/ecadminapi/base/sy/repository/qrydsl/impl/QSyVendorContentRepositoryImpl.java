package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
    private static final QSyVendorContent c = QSyVendorContent.syVendorContent;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyAttachGrp atg = QSyAttachGrp.syAttachGrp;
    private static final QSyCode cdVct = new QSyCode("cd_vct");
    private static final QSyCode cdVcs = new QSyCode("cd_vcs");

    /* 업체 콘텐츠 buildBaseQuery */
    private JPAQuery<SyVendorContentDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorContentDto.Item.class,
                        c.vendorContentId, c.siteId, c.vendorId, c.contentTypeCd,
                        c.vendorContentTitle, c.vendorContentSubtitle, c.contentHtml,
                        c.thumbUrl, c.imageUrl, c.linkUrl, c.attachGrpId, c.langCd,
                        c.startDate, c.endDate, c.sortOrd,
                        c.vendorContentStatusCd, c.useYn, c.viewCount, c.vendorContentRemark,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        vnd.vendorNm.as("vendorNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(c.vendorId))
                .leftJoin(atg).on(atg.attachGrpId.eq(c.attachGrpId))
                .leftJoin(cdVct).on(cdVct.codeGrp.eq("VENDOR_CONTENT_TYPE").and(cdVct.codeValue.eq(c.contentTypeCd)))
                .leftJoin(cdVcs).on(cdVcs.codeGrp.eq("VENDOR_CONTENT_STATUS").and(cdVcs.codeValue.eq(c.vendorContentStatusCd)));
    }

    /* 업체 콘텐츠 키조회 */
    @Override
    public Optional<SyVendorContentDto.Item> selectById(String vendorContentId) {
        SyVendorContentDto.Item dto = buildBaseQuery()
                .where(c.vendorContentId.eq(vendorContentId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체 콘텐츠 목록조회 */
    @Override
    public List<SyVendorContentDto.Item> selectList(SyVendorContentDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorContentDto.Item> query = buildBaseQuery().where(where);
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
    public SyVendorContentDto.PageResponse selectPageList(SyVendorContentDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorContentDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorContentDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(where).fetchOne();

        SyVendorContentDto.PageResponse res = new SyVendorContentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyVendorContentDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))          w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getVendorContentId())) w.and(c.vendorContentId.eq(s.getVendorContentId()));
        if (StringUtils.hasText(s.getVendorId()))        w.and(c.vendorId.eq(s.getVendorId()));
        if (StringUtils.hasText(s.getStatus()))          w.and(c.vendorContentStatusCd.eq(s.getStatus()));
        if (StringUtils.hasText(s.getContentTypeCd()))   w.and(c.contentTypeCd.eq(s.getContentTypeCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_vendor_content_title,")) or.or(c.vendorContentTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
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
                    orders.add(new OrderSpecifier(order, c.vendorContentId));
                } else if ("vendorContentTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.vendorContentTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    /* 업체 콘텐츠 수정 */
    @Override
    public int updateSelective(SyVendorContent entity) {
        if (entity.getVendorContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(c.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVendorId()              != null) { update.set(c.vendorId,              entity.getVendorId());              hasAny = true; }
        if (entity.getContentTypeCd()         != null) { update.set(c.contentTypeCd,         entity.getContentTypeCd());         hasAny = true; }
        if (entity.getVendorContentTitle()    != null) { update.set(c.vendorContentTitle,    entity.getVendorContentTitle());    hasAny = true; }
        if (entity.getVendorContentSubtitle() != null) { update.set(c.vendorContentSubtitle, entity.getVendorContentSubtitle()); hasAny = true; }
        if (entity.getContentHtml()           != null) { update.set(c.contentHtml,           entity.getContentHtml());           hasAny = true; }
        if (entity.getThumbUrl()              != null) { update.set(c.thumbUrl,              entity.getThumbUrl());              hasAny = true; }
        if (entity.getImageUrl()              != null) { update.set(c.imageUrl,              entity.getImageUrl());              hasAny = true; }
        if (entity.getLinkUrl()               != null) { update.set(c.linkUrl,               entity.getLinkUrl());               hasAny = true; }
        if (entity.getAttachGrpId()           != null) { update.set(c.attachGrpId,           entity.getAttachGrpId());           hasAny = true; }
        if (entity.getLangCd()                != null) { update.set(c.langCd,                entity.getLangCd());                hasAny = true; }
        if (entity.getStartDate()             != null) { update.set(c.startDate,             entity.getStartDate());             hasAny = true; }
        if (entity.getEndDate()               != null) { update.set(c.endDate,               entity.getEndDate());               hasAny = true; }
        if (entity.getSortOrd()               != null) { update.set(c.sortOrd,               entity.getSortOrd());               hasAny = true; }
        if (entity.getVendorContentStatusCd() != null) { update.set(c.vendorContentStatusCd, entity.getVendorContentStatusCd()); hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(c.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getViewCount()             != null) { update.set(c.viewCount,             entity.getViewCount());             hasAny = true; }
        if (entity.getVendorContentRemark()   != null) { update.set(c.vendorContentRemark,   entity.getVendorContentRemark());   hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(c.updBy,                 entity.getUpdBy());                 hasAny = true; }
        if (entity.getUpdDate()               != null) { update.set(c.updDate,               entity.getUpdDate());               hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.vendorContentId.eq(entity.getVendorContentId())).execute();
        return (int) affected;
    }
}
