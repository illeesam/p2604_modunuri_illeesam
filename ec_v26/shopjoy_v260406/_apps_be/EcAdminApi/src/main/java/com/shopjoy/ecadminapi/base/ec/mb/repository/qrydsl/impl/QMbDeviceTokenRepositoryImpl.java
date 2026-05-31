package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QMbDeviceTokenRepositoryImpl implements QMbDeviceTokenRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbDeviceTokenRepositoryImpl";
    private static final QMbDeviceToken a   = QMbDeviceToken.mbDeviceToken;
    private static final QMbMember      mem = QMbMember.mbMember;

    /* baseSelColumnQuery */
    private JPAQuery<MbDeviceTokenDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbDeviceTokenDto.Item.class,
                        a.deviceTokenId, a.deviceToken, a.siteId, a.memberId,
                        a.osType, a.benefitNotiYn, a.alimReadDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        mem.memberNm.as("memberNm")
                ))
                .from(a)
                .leftJoin(mem).on(mem.memberId.eq(a.memberId));
    }

    /* 키조회 */
    @Override
    public Optional<MbDeviceTokenDto.Item> selectById(String deviceTokenId) {
        return Optional.ofNullable(baseSelColumnQuery().where(a.deviceTokenId.eq(deviceTokenId)).fetchOne());
    }

    /* 목록조회 */
    @Override
    public List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbDeviceTokenDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndDeviceTokenId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public MbDeviceTokenDto.PageResponse selectPageList(MbDeviceTokenDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbDeviceTokenDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndDeviceTokenId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbDeviceTokenDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndDeviceTokenId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        MbDeviceTokenDto.PageResponse res = new MbDeviceTokenDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(MbDeviceTokenDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* deviceTokenId 정확 일치 */
    private BooleanExpression baseAndDeviceTokenId(MbDeviceTokenDto.Request search) {
        return search != null && StringUtils.hasText(search.getDeviceTokenId())
                ? a.deviceTokenId.eq(search.getDeviceTokenId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbDeviceTokenDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(MbDeviceTokenDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",benefitNotiYn,", a.benefitNotiYn, pattern);
        or = orLike(or, all, types, ",deviceToken,", a.deviceToken, pattern);
        or = orLike(or, all, types, ",deviceTokenId,", a.deviceTokenId, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",osType,", a.osType, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbDeviceTokenDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.deviceTokenId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("deviceTokenId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.deviceTokenId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.deviceTokenId));
        }
        return orders;
    }

    /* 수정 */


    @Override
    public int updateSelective(MbDeviceToken entity) {
        if (entity.getDeviceTokenId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;
        if (entity.getDeviceToken()   != null) { update.set(a.deviceToken,   entity.getDeviceToken());   hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(a.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOsType()        != null) { update.set(a.osType,        entity.getOsType());        hasAny = true; }
        if (entity.getBenefitNotiYn() != null) { update.set(a.benefitNotiYn, entity.getBenefitNotiYn()); hasAny = true; }
        if (entity.getAlimReadDate()  != null) { update.set(a.alimReadDate,  entity.getAlimReadDate());  hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(a.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(a.deviceTokenId.eq(entity.getDeviceTokenId())).execute();
    }
}
