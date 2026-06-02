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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyNotice QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyNoticeRepositoryImpl implements QSyNoticeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyNoticeRepositoryImpl";
    private static final QSyNotice syNotice = QSyNotice.syNotice;
    private static final QSySite sySite = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 공지사항 baseSelColumnQuery */
    private JPAQuery<SyNoticeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyNoticeDto.Item.class,
                        syNotice.noticeId, syNotice.siteId, syNotice.noticeTitle, syNotice.noticeTypeCd, syNotice.isFixed,
                        syNotice.contentHtml, syNotice.attachGrpId, syNotice.startDate, syNotice.endDate,
                        syNotice.noticeStatusCd, syNotice.viewCount,
                        syNotice.regBy, syNotice.regDate, syNotice.updBy, syNotice.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syNotice)
                .leftJoin(sySite).on(sySite.siteId.eq(syNotice.siteId));
    }

    /* 공지사항 키조회 */
    @Override
    public Optional<SyNoticeDto.Item> selectById(String noticeId) {
        SyNoticeDto.Item dto = baseSelColumnQuery().where(syNotice.noticeId.eq(noticeId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공지사항 목록조회 */
    @Override
    public List<SyNoticeDto.Item> selectList(SyNoticeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyNoticeDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndNoticeId(search),
                baseAndStatus(search),
                baseAndNoticeTypeCd(search),
                baseAndIsFixed(search),
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

    /* 공지사항 페이지조회 */
    @Override
    public SyNoticeDto.PageResponse selectPageData(SyNoticeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyNoticeDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndNoticeId(search),
                baseAndStatus(search),
                baseAndNoticeTypeCd(search),
                baseAndIsFixed(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyNoticeDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syNotice.count()).from(syNotice).where(
                baseAndSiteId(search),
                baseAndNoticeId(search),
                baseAndStatus(search),
                baseAndNoticeTypeCd(search),
                baseAndIsFixed(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyNoticeDto.PageResponse res = new SyNoticeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyNoticeDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syNotice.siteId.eq(search.getSiteId()) : null;
    }

    /* noticeId 정확 일치 */
    private BooleanExpression baseAndNoticeId(SyNoticeDto.Request search) {
        return search != null && StringUtils.hasText(search.getNoticeId())
                ? syNotice.noticeId.eq(search.getNoticeId()) : null;
    }

    /* noticeStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyNoticeDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? syNotice.noticeStatusCd.eq(search.getStatus()) : null;
    }

    /* noticeTypeCd 정확 일치 */
    private BooleanExpression baseAndNoticeTypeCd(SyNoticeDto.Request search) {
        return search != null && StringUtils.hasText(search.getNoticeTypeCd())
                ? syNotice.noticeTypeCd.eq(search.getNoticeTypeCd()) : null;
    }

    /* isFixed 정확 일치 */
    private BooleanExpression baseAndIsFixed(SyNoticeDto.Request search) {
        return search != null && StringUtils.hasText(search.getIsFixed())
                ? syNotice.isFixed.eq(search.getIsFixed()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyNoticeDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachGrpId,", syNotice.attachGrpId, pattern);
        or = orLike(or, all, types, ",contentHtml,", syNotice.contentHtml, pattern);
        or = orLike(or, all, types, ",isFixed,", syNotice.isFixed, pattern);
        or = orLike(or, all, types, ",noticeId,", syNotice.noticeId, pattern);
        or = orLike(or, all, types, ",noticeStatusCd,", syNotice.noticeStatusCd, pattern);
        or = orLike(or, all, types, ",noticeTitle,", syNotice.noticeTitle, pattern);
        or = orLike(or, all, types, ",noticeTypeCd,", syNotice.noticeTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", syNotice.siteId, pattern);
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
