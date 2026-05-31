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
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyTemplate QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyTemplateRepositoryImpl implements QSyTemplateRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyTemplateRepositoryImpl";
    private static final QSyTemplate t = QSyTemplate.syTemplate;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 템플릿 키조회 */
    @Override
    public Optional<SyTemplateDto.Item> selectById(String templateId) {
        SyTemplateDto.Item dto = baseQuery().where(t.templateId.eq(templateId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 템플릿 목록조회 */
    @Override
    public List<SyTemplateDto.Item> selectList(SyTemplateDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyTemplateDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andTemplateId(search),
                andTemplateTypeCd(search),
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

    /* 템플릿 페이지조회 */
    @Override
    public SyTemplateDto.PageResponse selectPageList(SyTemplateDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyTemplateDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andTemplateId(search),
                andTemplateTypeCd(search),
                andUseYn(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyTemplateDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(
                andSiteId(search),
                andPathId(search),
                andTemplateId(search),
                andTemplateTypeCd(search),
                andUseYn(search),
                andSearchValue(search)
        ).fetchOne();

        SyTemplateDto.PageResponse res = new SyTemplateDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 템플릿 baseQuery */
    private JPAQuery<SyTemplateDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyTemplateDto.Item.class,
                        t.templateId, t.siteId, t.templateTypeCd, t.templateCode, t.templateNm,
                        t.templateSubject, t.templateContent, t.sampleParams, t.useYn, t.pathId,
                        t.regBy, t.regDate, t.updBy, t.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(t)
                .leftJoin(ste).on(ste.siteId.eq(t.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? t.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? t.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_template"))
                : null;
    }

    /* templateId 정확 일치 */
    private BooleanExpression andTemplateId(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateId())
                ? t.templateId.eq(search.getTemplateId()) : null;
    }

    /* templateTypeCd 정확 일치 */
    private BooleanExpression andTemplateTypeCd(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateTypeCd())
                ? t.templateTypeCd.eq(search.getTemplateTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? t.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyTemplateDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",pathId,", t.pathId, pattern);
        or = orLike(or, all, types, ",sampleParams,", t.sampleParams, pattern);
        or = orLike(or, all, types, ",siteId,", t.siteId, pattern);
        or = orLike(or, all, types, ",templateCode,", t.templateCode, pattern);
        or = orLike(or, all, types, ",templateContent,", t.templateContent, pattern);
        or = orLike(or, all, types, ",templateId,", t.templateId, pattern);
        or = orLike(or, all, types, ",templateNm,", t.templateNm, pattern);
        or = orLike(or, all, types, ",templateSubject,", t.templateSubject, pattern);
        or = orLike(or, all, types, ",templateTypeCd,", t.templateTypeCd, pattern);
        or = orLike(or, all, types, ",useYn,", t.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyTemplateDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.templateId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("templateId".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.templateId));
                } else if ("templateNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.templateNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.templateId));
        }
        return orders;
    }

    /* 템플릿 수정 */
    @Override
    public int updateSelective(SyTemplate entity) {
        if (entity.getTemplateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(t.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getTemplateTypeCd()  != null) { update.set(t.templateTypeCd,  entity.getTemplateTypeCd());  hasAny = true; }
        if (entity.getTemplateCode()    != null) { update.set(t.templateCode,    entity.getTemplateCode());    hasAny = true; }
        if (entity.getTemplateNm()      != null) { update.set(t.templateNm,      entity.getTemplateNm());      hasAny = true; }
        if (entity.getTemplateSubject() != null) { update.set(t.templateSubject, entity.getTemplateSubject()); hasAny = true; }
        if (entity.getTemplateContent() != null) { update.set(t.templateContent, entity.getTemplateContent()); hasAny = true; }
        if (entity.getSampleParams()    != null) { update.set(t.sampleParams,    entity.getSampleParams());    hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(t.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(t.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(t.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()          != null) { update.set(t.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.templateId.eq(entity.getTemplateId())).execute();
        return (int) affected;
    }
}
