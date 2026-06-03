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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbLike;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbLikeRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QMbLikeRepositoryImpl implements QMbLikeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbLikeRepositoryImpl";
    private static final QMbLike   mbLike    = QMbLike.mbLike;
    private static final QSySite   sySite  = QSySite.sySite;
    private static final QMbMember mbMember  = QMbMember.mbMember;
    private static final QPdProd   pdProd  = QPdProd.pdProd;
    private static final QSyCode   cdLt = new QSyCode("cd_ltt");

    /* 좋아요(찜) baseSelColumnQuery */
    private JPAQuery<MbLikeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbLikeDto.Item.class,
                        mbLike.likeId, mbLike.siteId, mbLike.memberId, mbLike.targetTypeCd, mbLike.targetId,
                        mbLike.regBy, mbLike.regDate, mbLike.updBy, mbLike.updDate
                ))
                .from(mbLike)
                .leftJoin(sySite).on(sySite.siteId.eq(mbLike.siteId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbLike.memberId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(mbLike.targetId))
                .leftJoin(cdLt).on(cdLt.codeGrp.eq("LIKE_TARGET_TYPE").and(cdLt.codeValue.eq(mbLike.targetTypeCd)));
    }

    /* 좋아요(찜) 키조회 */
    @Override
    public Optional<MbLikeDto.Item> selectById(String likeId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbLike.likeId.eq(likeId)).fetchOne());
    }

    /* 좋아요(찜) 목록조회 */
    @Override
    public List<MbLikeDto.Item> selectList(MbLikeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbLikeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndLikeId(search),
                    baseAndMemberId(search),
                    baseAndTargetId(search),
                    baseAndTargetTypeCd(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 좋아요(찜) 페이지조회 */
    @Override
    public MbLikeDto.PageResponse selectPageData(MbLikeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndLikeId(search),
                baseAndMemberId(search),
                baseAndTargetId(search),
                baseAndTargetTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbLikeDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbLikeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbLike.count())
                .where(wheres)
                .fetchOne();

        MbLikeDto.PageResponse res = new MbLikeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 좋아요(찜) buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(MbLikeDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? mbLike.siteId.eq(search.getSiteId()) : null;
    }

    /* likeId 정확 일치 */
    private BooleanExpression baseAndLikeId(MbLikeDto.Request search) {
        return search != null && StringUtils.hasText(search.getLikeId())
                ? mbLike.likeId.eq(search.getLikeId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(MbLikeDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? mbLike.memberId.eq(search.getMemberId()) : null;
    }

    /* targetId 정확 일치 */
    private BooleanExpression baseAndTargetId(MbLikeDto.Request search) {
        return search != null && StringUtils.hasText(search.getTargetId())
                ? mbLike.targetId.eq(search.getTargetId()) : null;
    }

    /* targetTypeCd 정확 일치 */
    private BooleanExpression baseAndTargetTypeCd(MbLikeDto.Request search) {
        return search != null && StringUtils.hasText(search.getTargetTypeCd())
                ? mbLike.targetTypeCd.eq(search.getTargetTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbLikeDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbLike.regDate.goe(start).and(mbLike.regDate.lt(endExcl));
            case "upd_date": return mbLike.updDate.goe(start).and(mbLike.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(MbLikeDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",likeId,", mbLike.likeId, pattern);
        or = orLike(or, all, types, ",memberId,", mbLike.memberId, pattern);
        or = orLike(or, all, types, ",siteId,", mbLike.siteId, pattern);
        or = orLike(or, all, types, ",targetId,", mbLike.targetId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", mbLike.targetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbLikeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbLike.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbLike.likeId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("likeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbLike.likeId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbLike.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbLike.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbLike.likeId));
        }
        return orders;
    }

    /* 좋아요(찜) 수정 */


    @Override
    public int updateSelective(MbLike entity) {
        if (entity.getLikeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbLike);
        boolean hasAny = false;
        if (entity.getSiteId()       != null) { update.set(mbLike.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(mbLike.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(mbLike.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(mbLike.targetId,     entity.getTargetId());     hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(mbLike.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbLike.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbLike.likeId.eq(entity.getLikeId())).execute();
    }
}
