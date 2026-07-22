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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyNotice;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyNoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyNotice QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyNoticeRepositoryImpl implements QSyNoticeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyNoticeRepositoryImpl";
    private static final QSyNotice syNotice = QSyNotice.syNotice;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attachGrpId", syNotice.attachGrpId),
        Map.entry("contentHtml", syNotice.contentHtml),
        Map.entry("isFixed", syNotice.isFixed),
        Map.entry("noticeId", syNotice.noticeId),
        Map.entry("noticeStatusCd", syNotice.noticeStatusCd),
        Map.entry("noticeTitle", syNotice.noticeTitle),
        Map.entry("noticeTypeCd", syNotice.noticeTypeCd),
        Map.entry("siteId", syNotice.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * NOTICE_TYPE     {NORMAL: '일반', URGENT: '긴급'}
     * NOTICE_STATUS_CD (sy_code 미등록, DDL 주석 기준) {ACTIVE: '활성', INACTIVE: '비활성'}
     * IS_FIXED        {Y: '상단고정', N: '일반'}
     */
    private JPAQuery<SyNoticeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyNoticeDto.Item.class,
                        syNotice.noticeId,        // 공지ID (YYMMDDhhmmss+rand4)
                        syNotice.siteId,          // 사이트ID (sy_site.site_id)
                        syNotice.noticeTitle,     // 제목
                        syNotice.noticeTypeCd,    // 공지유형 — NOTICE_TYPE {NORMAL: '일반', URGENT: '긴급'}
                        syNotice.isFixed,         // 상단고정 — IS_FIXED {Y: '상단고정', N: '일반'}
                        syNotice.contentHtml,     // 내용 (HTML)
                        syNotice.attachGrpId,     // 첨부파일그룹ID
                        syNotice.startDate,       // 노출시작일
                        syNotice.endDate,         // 노출종료일
                        syNotice.noticeStatusCd,  // 상태 — NOTICE_STATUS_CD {ACTIVE: '활성', INACTIVE: '비활성'}
                        syNotice.viewCount,       // 조회수
                        syNotice.regBy,           // 등록자
                        syNotice.regDate,         // 등록일시
                        syNotice.updBy,           // 수정자
                        syNotice.updDate,         // 수정일시
                        sySite.siteNm.as("siteNm")   // 사이트명 (sy_site 조인)
                ))
                .from(syNotice)
                .leftJoin(sySite).on(sySite.siteId.eq(syNotice.siteId));
    }

    /* 공지사항 키조회 */
    @Override
    public Optional<SyNoticeDto.Item> selectById(String noticeId) {
        SyNoticeDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syNotice.noticeId.eq(noticeId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공지사항 목록조회 */
    @Override
    public List<SyNoticeDto.Item> selectList(SyNoticeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyNoticeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(syNotice.siteId, search.getSiteId()),
                    QdslUtil.strEq(syNotice.noticeId, search.getNoticeId()),
                    QdslUtil.strEq(syNotice.noticeStatusCd, search.getStatus()),
                    QdslUtil.strEq(syNotice.noticeTypeCd, search.getNoticeTypeCd()),
                    QdslUtil.strEq(syNotice.isFixed, search.getIsFixed()),
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

    /* 공지사항 페이지조회 */
    @Override
    public SyNoticeDto.PageResponse selectPageData(SyNoticeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syNotice.siteId, search.getSiteId()),
                QdslUtil.strEq(syNotice.noticeId, search.getNoticeId()),
                QdslUtil.strEq(syNotice.noticeStatusCd, search.getStatus()),
                QdslUtil.strEq(syNotice.noticeTypeCd, search.getNoticeTypeCd()),
                QdslUtil.strEq(syNotice.isFixed, search.getIsFixed()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyNoticeDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyNoticeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syNotice.count())
                .where(wheres)
                .fetchOne();

        SyNoticeDto.PageResponse res = new SyNoticeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyNoticeDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyNoticeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syNotice.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syNotice.noticeId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("noticeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syNotice.noticeId));
                } else if ("noticeTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, syNotice.noticeTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syNotice.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syNotice.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syNotice.noticeId));
        }
        return orders;
    }

    /* 공지사항 수정 */

    @Override
    public int updateSelective(SyNotice entity) {
        if (entity.getNoticeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syNotice);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(syNotice.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getNoticeTitle()    != null) { update.set(syNotice.noticeTitle,    entity.getNoticeTitle());    hasAny = true; }
        if (entity.getNoticeTypeCd()   != null) { update.set(syNotice.noticeTypeCd,   entity.getNoticeTypeCd());   hasAny = true; }
        if (entity.getIsFixed()        != null) { update.set(syNotice.isFixed,        entity.getIsFixed());        hasAny = true; }
        if (entity.getContentHtml()    != null) { update.set(syNotice.contentHtml,    entity.getContentHtml());    hasAny = true; }
        if (entity.getAttachGrpId()    != null) { update.set(syNotice.attachGrpId,    entity.getAttachGrpId());    hasAny = true; }
        if (entity.getStartDate()      != null) { update.set(syNotice.startDate,      entity.getStartDate());      hasAny = true; }
        if (entity.getEndDate()        != null) { update.set(syNotice.endDate,        entity.getEndDate());        hasAny = true; }
        if (entity.getNoticeStatusCd() != null) { update.set(syNotice.noticeStatusCd, entity.getNoticeStatusCd()); hasAny = true; }
        if (entity.getViewCount()      != null) { update.set(syNotice.viewCount,      entity.getViewCount());      hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syNotice.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syNotice.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syNotice.noticeId.eq(entity.getNoticeId())).execute();
        return (int) affected;
    }
}
