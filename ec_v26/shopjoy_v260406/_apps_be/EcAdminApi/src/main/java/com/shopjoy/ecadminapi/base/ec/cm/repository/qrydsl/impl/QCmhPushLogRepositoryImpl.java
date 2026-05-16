package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmhPushLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmhPushLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmhPushLogRepositoryImpl implements QCmhPushLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmhPushLog l = QCmhPushLog.cmhPushLog;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmhPushLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmhPushLogDto.Item.class,
                        l.logId, l.siteId, l.channelCd, l.templateId, l.memberId,
                        l.recvAddr, l.pushLogTitle, l.pushLogContent,
                        l.resultCd, l.failReason, l.sendDate,
                        l.refTypeCd, l.refId,
                        l.regBy, l.regDate, l.updBy, l.updDate
                ))
                .from(l);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmhPushLogDto.Item> selectById(String logId) {
        CmhPushLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(logId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmhPushLogDto.Item> selectList(CmhPushLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmhPushLogDto.Item> query = buildBaseQuery().where(where);
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
    public CmhPushLogDto.PageResponse selectPageList(CmhPushLogDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmhPushLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmhPushLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        CmhPushLogDto.PageResponse res = new CmhPushLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(CmhPushLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))  w.and(l.logId.eq(s.getLogId()));

        // searchValue + searchType (def_push_log_title)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_push_log_title,")) or.or(l.pushLogTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "send_date":
                    w.and(l.sendDate.goe(start)).and(l.sendDate.lt(endExcl));
                    break;
                case "reg_date":
                    w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(l.updDate.goe(start)).and(l.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmhPushLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("logId".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.logId));
                } else if ("pushLogTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.pushLogTitle));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.sendDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — Mapper XML 에 update 미정의이나 Mapper Java 에 선언되어 있어 Entity 모든 갱신 필드 대상으로 처리 */
    @Override
    public int updateSelective(CmhPushLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(l.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getChannelCd()      != null) { update.set(l.channelCd,      entity.getChannelCd());      hasAny = true; }
        if (entity.getTemplateId()     != null) { update.set(l.templateId,     entity.getTemplateId());     hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(l.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getRecvAddr()       != null) { update.set(l.recvAddr,       entity.getRecvAddr());       hasAny = true; }
        if (entity.getPushLogTitle()   != null) { update.set(l.pushLogTitle,   entity.getPushLogTitle());   hasAny = true; }
        if (entity.getPushLogContent() != null) { update.set(l.pushLogContent, entity.getPushLogContent()); hasAny = true; }
        if (entity.getResultCd()       != null) { update.set(l.resultCd,       entity.getResultCd());       hasAny = true; }
        if (entity.getFailReason()     != null) { update.set(l.failReason,     entity.getFailReason());     hasAny = true; }
        if (entity.getSendDate()       != null) { update.set(l.sendDate,       entity.getSendDate());       hasAny = true; }
        if (entity.getRefTypeCd()      != null) { update.set(l.refTypeCd,      entity.getRefTypeCd());      hasAny = true; }
        if (entity.getRefId()          != null) { update.set(l.refId,          entity.getRefId());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(l.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(l.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
