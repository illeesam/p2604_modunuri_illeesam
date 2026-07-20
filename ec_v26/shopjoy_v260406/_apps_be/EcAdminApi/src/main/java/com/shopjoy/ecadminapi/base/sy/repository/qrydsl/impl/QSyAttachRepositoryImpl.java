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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyAttach QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachRepositoryImpl implements QSyAttachRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAttachRepositoryImpl";
    private static final QSyAttach syAttach = QSyAttach.syAttach;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attachGrpId", syAttach.attachGrpId),
        Map.entry("attachId", syAttach.attachId),
        Map.entry("attachMemo", syAttach.attachMemo),
        Map.entry("attachUrl", syAttach.attachUrl),
        Map.entry("cdnHost", syAttach.cdnHost),
        Map.entry("cdnImgUrl", syAttach.cdnImgUrl),
        Map.entry("cdnThumbUrl", syAttach.cdnThumbUrl),
        Map.entry("fileExt", syAttach.fileExt),
        Map.entry("fileNm", syAttach.fileNm),
        Map.entry("mimeTypeCd", syAttach.mimeTypeCd),
        Map.entry("physicalPath", syAttach.physicalPath),
        Map.entry("siteId", syAttach.siteId),
        Map.entry("storagePath", syAttach.storagePath),
        Map.entry("storageType", syAttach.storageType),
        Map.entry("storedNm", syAttach.storedNm),
        Map.entry("thumbCdnUrl", syAttach.thumbCdnUrl),
        Map.entry("thumbFileNm", syAttach.thumbFileNm),
        Map.entry("thumbGeneratedYn", syAttach.thumbGeneratedYn),
        Map.entry("thumbStoredNm", syAttach.thumbStoredNm),
        Map.entry("thumbUrl", syAttach.thumbUrl)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * THUMB_GENERATED_YN {Y: '생성됨', N: '미생성'} (동영상은 필수 Y, 이미지는 선택)
     * STORAGE_TYPE (sy_code 미등록, 자유 문자열) {LOCAL: '로컬', AWS_S3: 'AWS S3', NCP_OBS: '네이버클라우드 OBS'}
     */
    private JPAQuery<SyAttachDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachDto.Item.class,
                        syAttach.attachId,           // 첨부파일 ID (YYMMDDhhmmss+random(4)+seq)
                        syAttach.siteId,             // 사이트ID (sy_site.site_id)
                        syAttach.attachGrpId,        // 파일 그룹 ID (sy_attach_grp 과 연계)
                        syAttach.fileNm,             // 원본 파일명
                        syAttach.fileSize,           // 파일 크기
                        syAttach.fileExt,            // 파일 확장자
                        syAttach.mimeTypeCd,         // MIME 타입
                        syAttach.storedNm,           // 저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)
                        syAttach.attachUrl,          // 첨부파일 URL
                        syAttach.storagePath,        // 파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명})
                        syAttach.physicalPath,       // 실제 물리 저장 전체 경로 (서버 절대경로)
                        syAttach.cdnHost,            // CDN 호스트
                        syAttach.cdnImgUrl,          // CDN 이미지 URL
                        syAttach.cdnThumbUrl,        // CDN 썸네일 URL
                        syAttach.thumbFileNm,        // 썸네일 원본 파일명
                        syAttach.thumbStoredNm,      // 썸네일 저장 파일명
                        syAttach.thumbUrl,           // 썸네일 URL
                        syAttach.thumbCdnUrl,        // 썸네일 CDN URL
                        syAttach.thumbGeneratedYn,   // 썸네일 생성 여부 — THUMB_GENERATED_YN {Y: '생성됨', N: '미생성'}
                        syAttach.sortOrd,            // 정렬순서
                        syAttach.attachMemo,         // 메모
                        syAttach.regBy,              // 등록자
                        syAttach.regDate,            // 등록일시
                        syAttach.updBy,              // 수정자
                        syAttach.updDate,            // 수정일시
                        sySite.siteNm.as("siteNm")   // 사이트명 (sy_site 조인)
                ))
                .from(syAttach)
                .leftJoin(sySite).on(sySite.siteId.eq(syAttach.siteId));
    }

    /* 첨부파일 키조회 */
    @Override
    public Optional<SyAttachDto.Item> selectById(String attachId) {
        SyAttachDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syAttach.attachId.eq(attachId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 첨부파일 목록조회 */
    @Override
    public List<SyAttachDto.Item> selectList(SyAttachDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search, false);
        JPAQuery<SyAttachDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(syAttach.siteId, search.getSiteId()),
                    QdslUtil.strEq(syAttach.attachId, search.getAttachId()),
                    QdslUtil.strEq(syAttach.attachGrpId, search.getAttachGrpId()),
                    QdslUtil.strEq(syAttach.mimeTypeCd, search.getMimeTypeCd()),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 첨부파일 페이지조회 */
    @Override
    public SyAttachDto.PageResponse selectPageData(SyAttachDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search, true);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syAttach.siteId, search.getSiteId()),
                QdslUtil.strEq(syAttach.attachId, search.getAttachId()),
                QdslUtil.strEq(syAttach.attachGrpId, search.getAttachGrpId()),
                QdslUtil.strEq(syAttach.mimeTypeCd, search.getMimeTypeCd()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyAttachDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyAttachDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syAttach.count())
                .where(wheres)
                .fetchOne();

        SyAttachDto.PageResponse res = new SyAttachDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(SyAttachDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * sort 미지정 시: 목록(forPage=false)은 sortOrd ASC 우선, 페이지(forPage=true)는 regDate DESC.
     * 안정 정렬 위해 마지막에 PK(attachId) 동률 키를 항상 추가한다.
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyAttachDto.Request s, boolean forPage) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            if (forPage) {
                orders.add(new OrderSpecifier(Order.DESC, syAttach.regDate));
            } else {
                orders.add(new OrderSpecifier(Order.ASC, syAttach.sortOrd));
                orders.add(new OrderSpecifier(Order.ASC, syAttach.regDate));
            }
        } else if ("id_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  syAttach.attachId));
        } else if ("id_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syAttach.attachId));
        } else if ("nm_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  syAttach.fileNm));
        } else if ("nm_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syAttach.fileNm));
        } else if ("reg_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  syAttach.regDate));
        } else if ("reg_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syAttach.regDate));
        } else {
            orders.add(new OrderSpecifier(Order.DESC, syAttach.regDate));
        }
        /* 안정 정렬 보장 — PK(attachId) 동률 키를 항상 마지막에 추가 */
        orders.add(new OrderSpecifier<>(Order.ASC, syAttach.attachId));
        return orders;
    }

    /* 첨부파일 수정 */

    @Override
    public int updateSelective(SyAttach entity) {
        if (entity.getAttachId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syAttach);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(syAttach.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(syAttach.attachGrpId,  entity.getAttachGrpId());  hasAny = true; }
        if (entity.getFileNm()       != null) { update.set(syAttach.fileNm,       entity.getFileNm());       hasAny = true; }
        if (entity.getFileSize()     != null) { update.set(syAttach.fileSize,     entity.getFileSize());     hasAny = true; }
        if (entity.getFileExt()      != null) { update.set(syAttach.fileExt,      entity.getFileExt());      hasAny = true; }
        if (entity.getMimeTypeCd()   != null) { update.set(syAttach.mimeTypeCd,   entity.getMimeTypeCd());   hasAny = true; }
        if (entity.getStoredNm()     != null) { update.set(syAttach.storedNm,     entity.getStoredNm());     hasAny = true; }
        if (entity.getAttachUrl()    != null) { update.set(syAttach.attachUrl,    entity.getAttachUrl());    hasAny = true; }
        if (entity.getPhysicalPath() != null) { update.set(syAttach.physicalPath, entity.getPhysicalPath()); hasAny = true; }
        if (entity.getCdnHost()      != null) { update.set(syAttach.cdnHost,      entity.getCdnHost());      hasAny = true; }
        if (entity.getCdnImgUrl()    != null) { update.set(syAttach.cdnImgUrl,    entity.getCdnImgUrl());    hasAny = true; }
        if (entity.getCdnThumbUrl()  != null) { update.set(syAttach.cdnThumbUrl,  entity.getCdnThumbUrl());  hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syAttach.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getAttachMemo()   != null) { update.set(syAttach.attachMemo,   entity.getAttachMemo());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syAttach.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syAttach.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syAttach.attachId.eq(entity.getAttachId())).execute();
        return (int) affected;
    }
}
