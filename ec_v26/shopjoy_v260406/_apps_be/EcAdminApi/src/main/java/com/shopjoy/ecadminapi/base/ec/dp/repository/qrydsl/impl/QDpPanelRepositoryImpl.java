package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QDpPanelRepositoryImpl implements QDpPanelRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    private static final QDpPanel p = QDpPanel.dpPanel;

    /* 전시 패널 키조회 */
    @Override
    public Optional<DpPanelDto.Item> selectById(String panelId) {
        return Optional.ofNullable(baseQuery().where(p.panelId.eq(panelId)).fetchOne());
    }

    /* 전시 패널 목록조회 */
    @Override
    public List<DpPanelDto.Item> selectList(DpPanelDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andPanelId(search),
                andDispPanelStatusCd(search),
                andPanelTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 전시 패널 페이지조회 */
    @Override
    public DpPanelDto.PageResponse selectPageList(DpPanelDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andPanelId(search),
                andDispPanelStatusCd(search),
                andPanelTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<DpPanelDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();
        Long total = queryFactory.select(p.count()).from(p).where(
                andSiteId(search),
                andPathId(search),
                andPanelId(search),
                andDispPanelStatusCd(search),
                andPanelTypeCd(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();
        DpPanelDto.PageResponse res = new DpPanelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 전시 패널 baseQuery */
    private JPAQuery<DpPanelDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpPanelDto.Item.class,
                p.panelId, p.siteId, p.panelNm, p.panelTypeCd, p.pathId,
                p.visibilityTargets, p.useYn, p.useStartDate, p.useEndDate,
                p.dispPanelStatusCd, p.dispPanelStatusCdBefore, p.contentJson,
                p.regBy, p.regDate, p.updBy, p.updDate
        )).from(p);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? p.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? p.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_panel"))
                : null;
    }

    /* panelId 정확 일치 */
    private BooleanExpression andPanelId(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getPanelId())
                ? p.panelId.eq(search.getPanelId()) : null;
    }

    /* dispPanelStatusCd 정확 일치 */
    private BooleanExpression andDispPanelStatusCd(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getDispPanelStatusCd())
                ? p.dispPanelStatusCd.eq(search.getDispPanelStatusCd()) : null;
    }

    /* panelTypeCd 정확 일치 */
    private BooleanExpression andPanelTypeCd(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getPanelTypeCd())
                ? p.panelTypeCd.eq(search.getPanelTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(DpPanelDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? p.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(DpPanelDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return p.regDate.goe(start).and(p.regDate.lt(endExcl));
            case "upd_date": return p.updDate.goe(start).and(p.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(DpPanelDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",contentJson,", p.contentJson, pattern);
        or = orLike(or, all, types, ",dispPanelStatusCd,", p.dispPanelStatusCd, pattern);
        or = orLike(or, all, types, ",dispPanelStatusCdBefore,", p.dispPanelStatusCdBefore, pattern);
        or = orLike(or, all, types, ",panelId,", p.panelId, pattern);
        or = orLike(or, all, types, ",panelNm,", p.panelNm, pattern);
        or = orLike(or, all, types, ",panelTypeCd,", p.panelTypeCd, pattern);
        or = orLike(or, all, types, ",pathId,", p.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", p.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", p.useYn, pattern);
        or = orLike(or, all, types, ",visibilityTargets,", p.visibilityTargets, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(DpPanelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.panelId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("panelId".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.panelId));
                } else if ("panelNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.panelNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.panelId));
        }
        return orders;
    }

    /* 전시 패널 수정 */
    @Override
    public int updateSelective(DpPanel entity) {
        if (entity.getPanelId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;
        if (entity.getSiteId()                  != null) { update.set(p.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getPanelNm()                 != null) { update.set(p.panelNm,                 entity.getPanelNm());                 hasAny = true; }
        if (entity.getPanelTypeCd()             != null) { update.set(p.panelTypeCd,             entity.getPanelTypeCd());             hasAny = true; }
        if (entity.getPathId()                  != null) { update.set(p.pathId,                  entity.getPathId());                  hasAny = true; }
        if (entity.getVisibilityTargets()       != null) { update.set(p.visibilityTargets,       entity.getVisibilityTargets());       hasAny = true; }
        if (entity.getUseYn()                   != null) { update.set(p.useYn,                   entity.getUseYn());                   hasAny = true; }
        if (entity.getUseStartDate()            != null) { update.set(p.useStartDate,            entity.getUseStartDate());            hasAny = true; }
        if (entity.getUseEndDate()              != null) { update.set(p.useEndDate,              entity.getUseEndDate());              hasAny = true; }
        if (entity.getDispPanelStatusCd()       != null) { update.set(p.dispPanelStatusCd,       entity.getDispPanelStatusCd());       hasAny = true; }
        if (entity.getDispPanelStatusCdBefore() != null) { update.set(p.dispPanelStatusCdBefore, entity.getDispPanelStatusCdBefore()); hasAny = true; }
        if (entity.getContentJson()             != null) { update.set(p.contentJson,             entity.getContentJson());             hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(p.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(p.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(p.panelId.eq(entity.getPanelId())).execute();
    }
}
