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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttach;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyAttach QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachRepositoryImpl implements QSyAttachRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAttachRepositoryImpl";
    private static final QSyAttach a = QSyAttach.syAttach;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 첨부파일 baseSelColumnQuery */
    private JPAQuery<SyAttachDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachDto.Item.class,
                        a.attachId, a.siteId, a.attachGrpId, a.fileNm, a.fileSize, a.fileExt,
                        a.mimeTypeCd, a.storedNm, a.attachUrl, a.storagePath, a.physicalPath,
                        a.cdnHost, a.cdnImgUrl, a.cdnThumbUrl, a.thumbFileNm, a.thumbStoredNm,
                        a.thumbUrl, a.thumbCdnUrl, a.thumbGeneratedYn, a.sortOrd, a.attachMemo,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId));
    }

    /* 첨부파일 키조회 */
    @Override
    public Optional<SyAttachDto.Item> selectById(String attachId) {
        SyAttachDto.Item dto = baseSelColumnQuery().where(a.attachId.eq(attachId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 첨부파일 목록조회 */
    @Override
    public List<SyAttachDto.Item> selectList(SyAttachDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search, false);
        JPAQuery<SyAttachDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndAttachId(search),
                baseAndAttachGrpId(search),
                baseAndMimeTypeCd(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 첨부파일 페이지조회 */
    @Override
    public SyAttachDto.PageResponse selectPageData(SyAttachDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search, true);

        JPAQuery<SyAttachDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndAttachId(search),
                baseAndAttachGrpId(search),
                baseAndMimeTypeCd(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyAttachDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndAttachId(search),
                baseAndAttachGrpId(search),
                baseAndMimeTypeCd(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyAttachDto.PageResponse res = new SyAttachDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* attachId 정확 일치 */
    private BooleanExpression baseAndAttachId(SyAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getAttachId())
                ? a.attachId.eq(search.getAttachId()) : null;
    }

    /* attachGrpId 정확 일치 */
    private BooleanExpression baseAndAttachGrpId(SyAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getAttachGrpId())
                ? a.attachGrpId.eq(search.getAttachGrpId()) : null;
    }

    /* mimeTypeCd 정확 일치 */
    private BooleanExpression baseAndMimeTypeCd(SyAttachDto.Request search) {
        return search != null && StringUtils.hasText(search.getMimeTypeCd())
                ? a.mimeTypeCd.eq(search.getMimeTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyAttachDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachGrpId,", a.attachGrpId, pattern);
        or = orLike(or, all, types, ",attachId,", a.attachId, pattern);
        or = orLike(or, all, types, ",attachMemo,", a.attachMemo, pattern);
        or = orLike(or, all, types, ",attachUrl,", a.attachUrl, pattern);
        or = orLike(or, all, types, ",cdnHost,", a.cdnHost, pattern);
        or = orLike(or, all, types, ",cdnImgUrl,", a.cdnImgUrl, pattern);
        or = orLike(or, all, types, ",cdnThumbUrl,", a.cdnThumbUrl, pattern);
        or = orLike(or, all, types, ",fileExt,", a.fileExt, pattern);
        or = orLike(or, all, types, ",fileNm,", a.fileNm, pattern);
        or = orLike(or, all, types, ",mimeTypeCd,", a.mimeTypeCd, pattern);
        or = orLike(or, all, types, ",physicalPath,", a.physicalPath, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",storagePath,", a.storagePath, pattern);
        or = orLike(or, all, types, ",storageType,", a.storageType, pattern);
        or = orLike(or, all, types, ",storedNm,", a.storedNm, pattern);
        or = orLike(or, all, types, ",thumbCdnUrl,", a.thumbCdnUrl, pattern);
        or = orLike(or, all, types, ",thumbFileNm,", a.thumbFileNm, pattern);
        or = orLike(or, all, types, ",thumbGeneratedYn,", a.thumbGeneratedYn, pattern);
        or = orLike(or, all, types, ",thumbStoredNm,", a.thumbStoredNm, pattern);
        or = orLike(or, all, types, ",thumbUrl,", a.thumbUrl, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyAttachDto.Request s, boolean forPage) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            if (forPage) {
                orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            } else {
                orders.add(new OrderSpecifier(Order.ASC, a.sortOrd));
                orders.add(new OrderSpecifier(Order.ASC, a.regDate));
            }
            /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
            /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
            if (orders.isEmpty()) {
                orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
                orders.add(new OrderSpecifier<>(Order.ASC, a.attachId));
            }
                orders.add(new OrderSpecifier<>(Order.ASC, a.attachId));
            return orders;
        }
        if ("id_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  a.attachId));
        } else if ("id_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.attachId));
        } else if ("nm_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  a.fileNm));
        } else if ("nm_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.fileNm));
        } else if ("reg_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  a.regDate));
        } else if ("reg_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
        } else {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        if (orders.isEmpty()) orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
        return orders;
    }

    /* 첨부파일 수정 */


    @Override
    public int updateSelective(SyAttach entity) {
        if (entity.getAttachId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(a.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(a.attachGrpId,  entity.getAttachGrpId());  hasAny = true; }
        if (entity.getFileNm()       != null) { update.set(a.fileNm,       entity.getFileNm());       hasAny = true; }
        if (entity.getFileSize()     != null) { update.set(a.fileSize,     entity.getFileSize());     hasAny = true; }
        if (entity.getFileExt()      != null) { update.set(a.fileExt,      entity.getFileExt());      hasAny = true; }
        if (entity.getMimeTypeCd()   != null) { update.set(a.mimeTypeCd,   entity.getMimeTypeCd());   hasAny = true; }
        if (entity.getStoredNm()     != null) { update.set(a.storedNm,     entity.getStoredNm());     hasAny = true; }
        if (entity.getAttachUrl()    != null) { update.set(a.attachUrl,    entity.getAttachUrl());    hasAny = true; }
        if (entity.getPhysicalPath() != null) { update.set(a.physicalPath, entity.getPhysicalPath()); hasAny = true; }
        if (entity.getCdnHost()      != null) { update.set(a.cdnHost,      entity.getCdnHost());      hasAny = true; }
        if (entity.getCdnImgUrl()    != null) { update.set(a.cdnImgUrl,    entity.getCdnImgUrl());    hasAny = true; }
        if (entity.getCdnThumbUrl()  != null) { update.set(a.cdnThumbUrl,  entity.getCdnThumbUrl());  hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(a.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getAttachMemo()   != null) { update.set(a.attachMemo,   entity.getAttachMemo());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.attachId.eq(entity.getAttachId())).execute();
        return (int) affected;
    }
}
