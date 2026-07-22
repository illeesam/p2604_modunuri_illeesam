package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syVendorContent.regDate,
        "upd_date", syVendorContent.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attachGrpId", syVendorContent.attachGrpId),
        Map.entry("contentHtml", syVendorContent.contentHtml),
        Map.entry("contentTypeCd", syVendorContent.contentTypeCd),
        Map.entry("imageUrl", syVendorContent.imageUrl),
        Map.entry("langCd", syVendorContent.langCd),
        Map.entry("linkUrl", syVendorContent.linkUrl),
        Map.entry("siteId", syVendorContent.siteId),
        Map.entry("thumbUrl", syVendorContent.thumbUrl),
        Map.entry("useYn", syVendorContent.useYn),
        Map.entry("vendorContentId", syVendorContent.vendorContentId),
        Map.entry("vendorContentRemark", syVendorContent.vendorContentRemark),
        Map.entry("vendorContentStatusCd", syVendorContent.vendorContentStatusCd),
        Map.entry("vendorContentSubtitle", syVendorContent.vendorContentSubtitle),
        Map.entry("vendorContentTitle", syVendorContent.vendorContentTitle),
        Map.entry("vendorId", syVendorContent.vendorId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VENDOR_CONTENT_TYPE    {INTRO: '업체소개', POLICY: '정책/규정', NOTICE: '공지사항'}
     * VENDOR_CONTENT_STATUS  {DRAFT: '임시저장', ACTIVE: '게시중', INACTIVE: '비게시'}
     */
    /* 업체 콘텐츠 baseSelColumnQuery */
    private JPAQuery<SyVendorContentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorContentDto.Item.class,
                        syVendorContent.vendorContentId,             // 업체콘텐츠ID (PK)
                        syVendorContent.siteId,                      // 사이트ID (sy_site.site_id)
                        syVendorContent.vendorId,                    // 업체ID (sy_vendor.vendor_id)
                        syVendorContent.contentTypeCd,                // 콘텐츠유형 — VENDOR_CONTENT_TYPE {INTRO: '업체소개', POLICY: '정책/규정', NOTICE: '공지사항'}
                        syVendorContent.vendorContentTitle,           // 제목
                        syVendorContent.vendorContentSubtitle,        // 부제
                        syVendorContent.contentHtml,                  // 본문 (HTML)
                        syVendorContent.thumbUrl,                     // 썸네일 URL
                        syVendorContent.imageUrl,                     // 대표 이미지 URL
                        syVendorContent.linkUrl,                      // 링크 URL
                        syVendorContent.attachGrpId,                  // 첨부파일그룹ID (sy_attach_grp.attach_grp_id)
                        syVendorContent.langCd,                       // 언어코드 (ko/en/ja)
                        syVendorContent.startDate,                    // 노출 시작일시
                        syVendorContent.endDate,                      // 노출 종료일시
                        syVendorContent.sortOrd,                      // 정렬순서
                        syVendorContent.vendorContentStatusCd,        // 상태 — VENDOR_CONTENT_STATUS {DRAFT: '임시저장', ACTIVE: '게시중', INACTIVE: '비게시'}
                        syVendorContent.useYn,                        // 사용여부 Y/N
                        syVendorContent.viewCount,                    // 조회수
                        syVendorContent.vendorContentRemark,          // 비고
                        syVendorContent.regBy,                        // 등록자
                        syVendorContent.regDate,                      // 등록일시
                        syVendorContent.updBy,                        // 수정자
                        syVendorContent.updDate,                      // 수정일시
                        syVendor.vendorNm.as("vendorNm")              // 업체명 (조인: sy_vendor)
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
                QdslUtil.strEq(syVendorContent.siteId, search.getSiteId()),
                QdslUtil.strEq(syVendorContent.vendorContentId, search.getVendorContentId()),
                QdslUtil.strEq(syVendorContent.vendorId, search.getVendorId()),
                QdslUtil.strEq(syVendorContent.vendorContentStatusCd, search.getStatus()),
                QdslUtil.strEq(syVendorContent.contentTypeCd, search.getContentTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 업체 콘텐츠 페이지조회 */
    @Override
    public SyVendorContentDto.PageResponse selectPageData(SyVendorContentDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syVendorContent.siteId, search.getSiteId()),
                QdslUtil.strEq(syVendorContent.vendorContentId, search.getVendorContentId()),
                QdslUtil.strEq(syVendorContent.vendorId, search.getVendorId()),
                QdslUtil.strEq(syVendorContent.vendorContentStatusCd, search.getStatus()),
                QdslUtil.strEq(syVendorContent.contentTypeCd, search.getContentTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyVendorContentDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyVendorContentDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorContent.count())
                .where(wheres)
                .fetchOne();

        SyVendorContentDto.PageResponse res = new SyVendorContentDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyVendorContentDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
