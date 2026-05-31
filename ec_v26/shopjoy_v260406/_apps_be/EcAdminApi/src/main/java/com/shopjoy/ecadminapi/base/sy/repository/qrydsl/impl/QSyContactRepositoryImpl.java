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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyContact;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyContact QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyContactRepositoryImpl implements QSyContactRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyContactRepositoryImpl";
    private static final QSyContact c = QSyContact.syContact;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 문의 키조회 */
    @Override
    public Optional<SyContactDto.Item> selectById(String contactId) {
        SyContactDto.Item dto = baseQuery().where(c.contactId.eq(contactId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 문의 목록조회 */
    @Override
    public List<SyContactDto.Item> selectList(SyContactDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyContactDto.Item> query = baseQuery().where(
                andSiteId(search),
                andContactId(search),
                andMemberId(search),
                andStatus(search),
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

    /* 문의 페이지조회 */
    @Override
    public SyContactDto.PageResponse selectPageList(SyContactDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyContactDto.Item> query = baseQuery().where(
                andSiteId(search),
                andContactId(search),
                andMemberId(search),
                andStatus(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyContactDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(
                andSiteId(search),
                andContactId(search),
                andMemberId(search),
                andStatus(search),
                andSearchValue(search)
        ).fetchOne();

        SyContactDto.PageResponse res = new SyContactDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 문의 baseQuery */
    private JPAQuery<SyContactDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyContactDto.Item.class,
                        c.contactId, c.siteId, c.memberId, c.memberNm, c.categoryCd,
                        c.contactTitle, c.contactContent, c.contentAttachGrpId, c.contactStatusCd,
                        c.contactAnswer, c.answerAttachGrpId, c.answerUserId, c.answerDate, c.contactDate,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyContactDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? c.siteId.eq(search.getSiteId()) : null;
    }

    /* contactId 정확 일치 */
    private BooleanExpression andContactId(SyContactDto.Request search) {
        return search != null && StringUtils.hasText(search.getContactId())
                ? c.contactId.eq(search.getContactId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression andMemberId(SyContactDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? c.memberId.eq(search.getMemberId()) : null;
    }

    /* contactStatusCd 정확 일치 */
    private BooleanExpression andStatus(SyContactDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? c.contactStatusCd.eq(search.getStatus()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyContactDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",answerUserId,", c.answerUserId, pattern);
        or = orLike(or, all, types, ",contentAttachGrpId,", c.contentAttachGrpId, pattern);
        or = orLike(or, all, types, ",answerAttachGrpId,", c.answerAttachGrpId, pattern);
        or = orLike(or, all, types, ",categoryCd,", c.categoryCd, pattern);
        or = orLike(or, all, types, ",contactAnswer,", c.contactAnswer, pattern);
        or = orLike(or, all, types, ",contactContent,", c.contactContent, pattern);
        or = orLike(or, all, types, ",contactId,", c.contactId, pattern);
        or = orLike(or, all, types, ",contactStatusCd,", c.contactStatusCd, pattern);
        or = orLike(or, all, types, ",contactTitle,", c.contactTitle, pattern);
        or = orLike(or, all, types, ",memberId,", c.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", c.memberNm, pattern);
        or = orLike(or, all, types, ",siteId,", c.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyContactDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.contactId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("contactId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.contactId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.contactId));
        }
        return orders;
    }

    /* 문의 수정 */
    @Override
    public int updateSelective(SyContact entity) {
        if (entity.getContactId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(c.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getMemberId()        != null) { update.set(c.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getMemberNm()        != null) { update.set(c.memberNm,        entity.getMemberNm());        hasAny = true; }
        if (entity.getCategoryCd()      != null) { update.set(c.categoryCd,      entity.getCategoryCd());      hasAny = true; }
        if (entity.getContactTitle()    != null) { update.set(c.contactTitle,    entity.getContactTitle());    hasAny = true; }
        if (entity.getContactContent()  != null) { update.set(c.contactContent,  entity.getContactContent());  hasAny = true; }
        if (entity.getContentAttachGrpId() != null) { update.set(c.contentAttachGrpId, entity.getContentAttachGrpId()); hasAny = true; }
        if (entity.getContactStatusCd() != null) { update.set(c.contactStatusCd, entity.getContactStatusCd()); hasAny = true; }
        if (entity.getContactAnswer()   != null) { update.set(c.contactAnswer,   entity.getContactAnswer());   hasAny = true; }
        if (entity.getAnswerAttachGrpId() != null) { update.set(c.answerAttachGrpId, entity.getAnswerAttachGrpId()); hasAny = true; }
        if (entity.getAnswerUserId()    != null) { update.set(c.answerUserId,    entity.getAnswerUserId());    hasAny = true; }
        if (entity.getAnswerDate()      != null) { update.set(c.answerDate,      entity.getAnswerDate());      hasAny = true; }
        if (entity.getContactDate()     != null) { update.set(c.contactDate,     entity.getContactDate());     hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(c.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(c.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(c.contactId.eq(entity.getContactId())).execute();
        return (int) affected;
    }
}
