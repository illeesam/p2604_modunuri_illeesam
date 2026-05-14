package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattMsgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmChattMsg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattMsgRepositoryImpl implements QCmChattMsgRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmChattMsg m = QCmChattMsg.cmChattMsg;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmChattMsgDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmChattMsgDto.Item.class,
                        m.chattMsgId, m.siteId, m.chattRoomId, m.senderCd,
                        m.msgText, m.refType, m.refId, m.sendDate, m.readYn,
                        m.regBy, m.regDate, m.updBy, m.updDate
                ))
                .from(m);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmChattMsgDto.Item> selectById(String chattMsgId) {
        CmChattMsgDto.Item dto = buildBaseQuery()
                .where(m.chattMsgId.eq(chattMsgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmChattMsgDto.Item> selectList(CmChattMsgDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattMsgDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmChattMsgDto.PageResponse selectPageList(CmChattMsgDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmChattMsgDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmChattMsgDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(m.count())
                .from(m)
                .where(where)
                .fetchOne();

        CmChattMsgDto.PageResponse res = new CmChattMsgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    private BooleanBuilder buildCondition(CmChattMsgDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(m.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getChattMsgId())) w.and(m.chattMsgId.eq(s.getChattMsgId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "send_date":
                    w.and(m.sendDate.goe(start)).and(m.sendDate.lt(endExcl));
                    break;
                case "reg_date":
                    w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /** 정렬조건 빌드 */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattMsgDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  m.chattMsgId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, m.chattMsgId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  m.sendDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, m.sendDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, m.regDate));    break;
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmChattMsg entity) {
        if (entity.getChattMsgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(m.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getChattRoomId() != null) { update.set(m.chattRoomId, entity.getChattRoomId()); hasAny = true; }
        if (entity.getSenderCd()    != null) { update.set(m.senderCd,    entity.getSenderCd());    hasAny = true; }
        if (entity.getMsgText()     != null) { update.set(m.msgText,     entity.getMsgText());     hasAny = true; }
        if (entity.getRefType()     != null) { update.set(m.refType,     entity.getRefType());     hasAny = true; }
        if (entity.getRefId()       != null) { update.set(m.refId,       entity.getRefId());       hasAny = true; }
        if (entity.getSendDate()    != null) { update.set(m.sendDate,    entity.getSendDate());    hasAny = true; }
        if (entity.getReadYn()      != null) { update.set(m.readYn,      entity.getReadYn());      hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(m.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(m.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.chattMsgId.eq(entity.getChattMsgId())).execute();
        return (int) affected;
    }
}
