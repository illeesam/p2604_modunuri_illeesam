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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVoc;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVocRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyVoc QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVocRepositoryImpl implements QSyVocRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyVoc v = QSyVoc.syVoc;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 고객의 소리(VOC) 키조회 */
    @Override
    public Optional<SyVocDto.Item> selectById(String vocId) {
        SyVocDto.Item dto = baseQuery().where(v.vocId.eq(vocId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 고객의 소리(VOC) 목록조회 */
    @Override
    public List<SyVocDto.Item> selectList(SyVocDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVocDto.Item> query = baseQuery().where(
                andSiteId(search),
                andVocId(search),
                andVocMasterCd(search),
                andVocDetailCd(search),
                andUseYn(search),
                andSearchValue(search)
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

    /* 고객의 소리(VOC) 페이지조회 */
    @Override
    public SyVocDto.PageResponse selectPageList(SyVocDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVocDto.Item> query = baseQuery().where(
                andSiteId(search),
                andVocId(search),
                andVocMasterCd(search),
                andVocDetailCd(search),
                andUseYn(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyVocDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(v.count()).from(v).where(
                andSiteId(search),
                andVocId(search),
                andVocMasterCd(search),
                andVocDetailCd(search),
                andUseYn(search),
                andSearchValue(search)
        ).fetchOne();

        SyVocDto.PageResponse res = new SyVocDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 고객의 소리(VOC) baseQuery */
    private JPAQuery<SyVocDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyVocDto.Item.class,
                        v.vocId, v.siteId, v.vocMasterCd, v.vocDetailCd, v.vocNm, v.vocContent, v.useYn,
                        v.regBy, v.regDate, v.updBy, v.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyVocDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? v.siteId.eq(search.getSiteId()) : null;
    }

    /* vocId 정확 일치 */
    private BooleanExpression andVocId(SyVocDto.Request search) {
        return search != null && StringUtils.hasText(search.getVocId())
                ? v.vocId.eq(search.getVocId()) : null;
    }

    /* vocMasterCd 정확 일치 */
    private BooleanExpression andVocMasterCd(SyVocDto.Request search) {
        return search != null && StringUtils.hasText(search.getVocMasterCd())
                ? v.vocMasterCd.eq(search.getVocMasterCd()) : null;
    }

    /* vocDetailCd 정확 일치 */
    private BooleanExpression andVocDetailCd(SyVocDto.Request search) {
        return search != null && StringUtils.hasText(search.getVocDetailCd())
                ? v.vocDetailCd.eq(search.getVocDetailCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(SyVocDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? v.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyVocDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",siteId,", v.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", v.useYn, pattern);
        or = orLike(or, all, types, ",vocContent,", v.vocContent, pattern);
        or = orLike(or, all, types, ",vocDetailCd,", v.vocDetailCd, pattern);
        or = orLike(or, all, types, ",vocId,", v.vocId, pattern);
        or = orLike(or, all, types, ",vocMasterCd,", v.vocMasterCd, pattern);
        or = orLike(or, all, types, ",vocNm,", v.vocNm, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyVocDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, v.vocId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vocId".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.vocId));
                } else if ("vocNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.vocNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, v.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, v.vocId));
        }
        return orders;
    }

    /* 고객의 소리(VOC) 수정 */
    @Override
    public int updateSelective(SyVoc entity) {
        if (entity.getVocId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(v.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getVocMasterCd() != null) { update.set(v.vocMasterCd, entity.getVocMasterCd()); hasAny = true; }
        if (entity.getVocDetailCd() != null) { update.set(v.vocDetailCd, entity.getVocDetailCd()); hasAny = true; }
        if (entity.getVocNm()       != null) { update.set(v.vocNm,       entity.getVocNm());       hasAny = true; }
        if (entity.getVocContent()  != null) { update.set(v.vocContent,  entity.getVocContent());  hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(v.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(v.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(v.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(v.vocId.eq(entity.getVocId())).execute();
        return (int) affected;
    }
}
