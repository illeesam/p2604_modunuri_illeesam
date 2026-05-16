package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyContact;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyContact QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyContactRepositoryImpl implements QSyContactRepository {

    private final JPAQueryFactory queryFactory;
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
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyContactDto.Item> query = baseQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyContactDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyContactDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(where).fetchOne();

        SyContactDto.PageResponse res = new SyContactDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 문의 baseQuery */
    private JPAQuery<SyContactDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyContactDto.Item.class,
                        c.contactId, c.siteId, c.memberId, c.memberNm, c.categoryCd,
                        c.contactTitle, c.contactContent, c.attachGrpId, c.contactStatusCd,
                        c.contactAnswer, c.answerUserId, c.answerDate, c.contactDate,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanBuilder buildCondition(SyContactDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getContactId())) w.and(c.contactId.eq(s.getContactId()));
        if (StringUtils.hasText(s.getMemberId()))  w.and(c.memberId.eq(s.getMemberId()));
        if (StringUtils.hasText(s.getCategoryCd()))w.and(c.categoryCd.eq(s.getCategoryCd()));
        if (StringUtils.hasText(s.getStatus()))    w.and(c.contactStatusCd.eq(s.getStatus()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",memberNm,"))     or.or(c.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains(",contactTitle,")) or.or(c.contactTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(ds.atStartOfDay())).and(c.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(c.updDate.goe(ds.atStartOfDay())).and(c.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
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
        if (entity.getAttachGrpId()     != null) { update.set(c.attachGrpId,     entity.getAttachGrpId());     hasAny = true; }
        if (entity.getContactStatusCd() != null) { update.set(c.contactStatusCd, entity.getContactStatusCd()); hasAny = true; }
        if (entity.getContactAnswer()   != null) { update.set(c.contactAnswer,   entity.getContactAnswer());   hasAny = true; }
        if (entity.getAnswerUserId()    != null) { update.set(c.answerUserId,    entity.getAnswerUserId());    hasAny = true; }
        if (entity.getAnswerDate()      != null) { update.set(c.answerDate,      entity.getAnswerDate());      hasAny = true; }
        if (entity.getContactDate()     != null) { update.set(c.contactDate,     entity.getContactDate());     hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(c.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(c.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.contactId.eq(entity.getContactId())).execute();
        return (int) affected;
    }
}
