package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorContent;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorContentRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** SyVendorContent(판매/배송업체 콘텐츠 (회사소개/배너/약관 등)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorContentRepositoryImpl implements QSyVendorContentRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorContentRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyVendorContent syVendorContent = QSyVendorContent.syVendorContent;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QVwSyCode codeContentTypeCd = new QVwSyCode("cd_vct");
    private static final QVwSyCode codeVendorContentStatusCd = new QVwSyCode("cd_vcs");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VENDOR_CONTENT_TYPE    {INTRO: '업체소개', POLICY: '정책/규정', NOTICE: '공지사항'}
     * VENDOR_CONTENT_STATUS  {DRAFT: '임시저장', ACTIVE: '게시중', INACTIVE: '비게시'}
     */
    /* 업체 콘텐츠 baseSelColumnQuery */
    private JPAQuery<SyVendorContentDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorContentDto.Item.class,
                        syVendorContent.vendorContentId,             // 업체콘텐츠ID (PK)
                        syVendorContent.vendorId,                    // 업체ID (sy_vendor.vendor_id)
                        syVendorContent.contentTypeCd,                // 콘텐츠유형 — VENDOR_CONTENT_TYPE {INTRO: '업체소개', POLICY: '정책/규정', NOTICE: '공지사항'}
                        codeContentTypeCd.codeLabel.as("contentTypeCdNm"), // 코드 라벨
                        syVendorContent.vendorContentTitle,           // 제목
                        syVendorContent.vendorContentSubtitle,        // 부제
                        syVendorContent.contentHtml,                  // 본문 (HTML)
                        syVendorContent.thumbUrl,                     // 썸네일 URL
                        syVendorContent.imageUrl,                     // 대표 이미지 URL
                        syVendorContent.linkUrl,                      // 링크 URL
                        syVendorContent.langCd,                       // 언어코드 (ko/en/ja)
                        syVendorContent.startDate,                    // 노출 시작일시
                        syVendorContent.endDate,                      // 노출 종료일시
                        syVendorContent.sortOrd,                      // 정렬순서
                        syVendorContent.vendorContentStatusCd,        // 상태 — VENDOR_CONTENT_STATUS {DRAFT: '임시저장', ACTIVE: '게시중', INACTIVE: '비게시'}
                        codeVendorContentStatusCd.codeLabel.as("vendorContentStatusCdNm"), // 코드 라벨
                        syVendorContent.useYn,                        // 사용여부 Y/N
                        syVendorContent.viewCount,                    // 조회수
                        syVendorContent.vendorContentRemark,          // 비고
                        syVendorContent.regBy,                        // 등록자
                        syVendorContent.regDate,                      // 등록일시
                        syVendorContent.updBy,                        // 수정자
                        syVendorContent.updDate,                      // 수정일시
                        syVendor.vendorNm.as("vendorNm"),              // 업체명 (조인: sy_vendor)
                        syVendorContent.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syVendorContent)
                .innerJoin(syVendor).on(syVendor.vendorId.eq(syVendorContent.vendorId)) // 업체
                // sySite·syAttachGrp 은 SELECT 대상 없는 dead JOIN → 제거됨
                .leftJoin(codeContentTypeCd).on(codeContentTypeCd.codeGrp.eq("VENDOR_CONTENT_TYPE").and(codeContentTypeCd.codeValue.eq(syVendorContent.contentTypeCd))) // 업체컨텐츠유형
                .leftJoin(codeVendorContentStatusCd).on(codeVendorContentStatusCd.codeGrp.eq("VENDOR_CONTENT_STATUS_CD").and(codeVendorContentStatusCd.codeValue.eq(syVendorContent.vendorContentStatusCd))) // 업체컨텐츠상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syVendorContent.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syVendorContent.regBy)) // 등록자
                ;
    }

    /* 업체 콘텐츠 키조회 */
    @Override
    public Optional<SyVendorContentDto.Item> selectById(String vendorContentId) {
        SyVendorContentDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorContent.vendorContentId.eq(vendorContentId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 업체 콘텐츠 목록조회 */
    @Override
    public List<SyVendorContentDto.Item> selectList(SyVendorContentDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorContent.vendorContentId, search.getVendorContentId())); // 업체콘텐츠ID 검색값
        whereList.add(QdslUtil.strEq(syVendorContent.vendorId, search.getVendorId())); // 업체ID 검색값
        whereList.add(QdslUtil.strEq(syVendorContent.vendorContentStatusCd, search.getStatus())); // 상태 검색값
        whereList.add(QdslUtil.strEq(syVendorContent.contentTypeCd, search.getContentTypeCd())); // 콘텐츠유형 검색값
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorContent.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorContent.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyVendorContentDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyVendorContentDto.Item> list = query.fetch();
        return list;
    }

    /* 업체 콘텐츠 페이지조회 */
    @Override
    public BasePage<SyVendorContentDto.Item> selectPageData(SyVendorContentDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorContent.vendorContentId, search.getVendorContentId())); // 업체콘텐츠ID 검색값
        whereList.add(QdslUtil.strEq(syVendorContent.vendorId, search.getVendorId())); // 업체ID 검색값
        whereList.add(QdslUtil.strEq(syVendorContent.vendorContentStatusCd, search.getStatus())); // 상태 검색값
        whereList.add(QdslUtil.strEq(syVendorContent.contentTypeCd, search.getContentTypeCd())); // 콘텐츠유형 검색값
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorContent.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorContent.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyVendorContentDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyVendorContentDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorContent.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyVendorContentDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "contentHtml,contentTypeCd,imageUrl,langCd,linkUrl" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("contentHtml", syVendorContent.contentHtml), // 본문 (HTML)
            QdslUtil.FieldDef.like("contentTypeCd", syVendorContent.contentTypeCd), // 콘텐츠유형 검색값
            QdslUtil.FieldDef.like("imageUrl", syVendorContent.imageUrl), // 대표 이미지 URL
            QdslUtil.FieldDef.like("langCd", syVendorContent.langCd), // 언어코드 (ko/en/ja)
            QdslUtil.FieldDef.like("linkUrl", syVendorContent.linkUrl), // 링크 URL
            QdslUtil.FieldDef.like("thumbUrl", syVendorContent.thumbUrl), // 썸네일 URL
            QdslUtil.FieldDef.like("useYn", syVendorContent.useYn), // 사용여부 검색값 Y/N
            QdslUtil.FieldDef.like("vendorContentId", syVendorContent.vendorContentId), // 업체콘텐츠ID 검색값
            QdslUtil.FieldDef.like("vendorContentRemark", syVendorContent.vendorContentRemark), // 비고
            QdslUtil.FieldDef.like("vendorContentStatusCd", syVendorContent.vendorContentStatusCd), // 상태 — VENDOR_CONTENT_STATUS_CD
            QdslUtil.FieldDef.like("vendorContentSubtitle", syVendorContent.vendorContentSubtitle), // 부제
            QdslUtil.FieldDef.like("vendorContentTitle", syVendorContent.vendorContentTitle), // 제목
            QdslUtil.FieldDef.like("vendorId", syVendorContent.vendorId) // 업체ID 검색값
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("vendorContentId", syVendorContent.vendorContentId,
                   "vendorContentTitle", syVendorContent.vendorContentTitle,
                   "regDate", syVendorContent.regDate,
                   "sortOrd", syVendorContent.sortOrd),
        new OrderSpecifier<>(Order.ASC, syVendorContent.sortOrd),
        new OrderSpecifier<>(Order.ASC, syVendorContent.regDate),
        new OrderSpecifier<>(Order.ASC, syVendorContent.vendorContentId));
    }

    /* 업체 콘텐츠 수정 */
    @Override
    public int updateSelective(SyVendorContent entity) {
        if (entity.getVendorContentId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorContent);
        boolean hasAny = false;

        if (entity.getVendorId()              != null) { update.set(syVendorContent.vendorId,              entity.getVendorId());              hasAny = true; }
        if (entity.getContentTypeCd()         != null) { update.set(syVendorContent.contentTypeCd,         entity.getContentTypeCd());         hasAny = true; }
        if (entity.getVendorContentTitle()    != null) { update.set(syVendorContent.vendorContentTitle,    entity.getVendorContentTitle());    hasAny = true; }
        if (entity.getVendorContentSubtitle() != null) { update.set(syVendorContent.vendorContentSubtitle, entity.getVendorContentSubtitle()); hasAny = true; }
        if (entity.getContentHtml()           != null) { update.set(syVendorContent.contentHtml,           entity.getContentHtml());           hasAny = true; }
        if (entity.getThumbUrl()              != null) { update.set(syVendorContent.thumbUrl,              entity.getThumbUrl());              hasAny = true; }
        if (entity.getImageUrl()              != null) { update.set(syVendorContent.imageUrl,              entity.getImageUrl());              hasAny = true; }
        if (entity.getLinkUrl()               != null) { update.set(syVendorContent.linkUrl,               entity.getLinkUrl());               hasAny = true; }
        if (entity.getLangCd()                != null) { update.set(syVendorContent.langCd,                entity.getLangCd());                hasAny = true; }
        if (entity.getStartDate()             != null) { update.set(syVendorContent.startDate,             entity.getStartDate());             hasAny = true; }
        if (entity.getEndDate()               != null) { update.set(syVendorContent.endDate,               entity.getEndDate());               hasAny = true; }
        if (entity.getSortOrd()               != null) { update.set(syVendorContent.sortOrd,               entity.getSortOrd());               hasAny = true; }
        if (entity.getVendorContentStatusCd() != null) { update.set(syVendorContent.vendorContentStatusCd, entity.getVendorContentStatusCd()); hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(syVendorContent.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getViewCount()             != null) { update.set(syVendorContent.viewCount,             entity.getViewCount());             hasAny = true; }
        if (entity.getVendorContentRemark()   != null) { update.set(syVendorContent.vendorContentRemark,   entity.getVendorContentRemark());   hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(syVendorContent.updBy,                 entity.getUpdBy());                 hasAny = true; }
        update.set(syVendorContent.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorContent.vendorContentId.eq(entity.getVendorContentId())).execute();
        return (int) affected;
    }
}
