package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendEmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhSendEmailLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhSendEmailLogRepositoryImpl implements QSyhSendEmailLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhSendEmailLog l   = QSyhSendEmailLog.syhSendEmailLog;
    private static final QSySite          ste = QSySite.sySite;
    private static final QSyTemplate      tpl = QSyTemplate.syTemplate;
    private static final QSyUser          usr = QSyUser.syUser;
    private static final QSyCode          cd_sr = new QSyCode("cd_sr");

    private JPAQuery<SyhSendEmailLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendEmailLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.templateId,
                        l.templateCode,
                        l.memberId,
                        l.userId,
                        l.fromAddr,
                        l.toAddr,
                        l.ccAddr,
                        l.bccAddr,
                        l.subject,
                        l.content,
                        l.params,
                        l.resultCd,
                        l.failReason,
                        l.sendDate,
                        l.refTypeCd,
                        l.refId,
                        l.regBy,
                        l.regDate,
                        l.updBy,
                        l.updDate,
                        ste.siteNm.as("siteNm"),
                        tpl.templateNm.as("templateNm"),
                        usr.userNm.as("userNm"),
                        cd_sr.codeLabel.as("resultCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(tpl).on(tpl.templateId.eq(l.templateId))
                .leftJoin(usr).on(usr.userId.eq(l.userId))
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(l.resultCd)));
    }

    @Override
    public Optional<SyhSendEmailLogDto.Item> selectById(String id) {
        SyhSendEmailLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyhSendEmailLogDto.Item> selectList(SyhSendEmailLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendEmailLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyhSendEmailLogDto.PageResponse selectPageList(SyhSendEmailLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendEmailLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhSendEmailLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhSendEmailLogDto.PageResponse res = new SyhSendEmailLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyhSendEmailLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))      w.and(l.logId.eq(s.getLogId()));
        if (StringUtils.hasText(s.getUserId()))     w.and(l.userId.eq(s.getUserId()));
        if (StringUtils.hasText(s.getTemplateId())) w.and(l.templateId.eq(s.getTemplateId()));
        if (StringUtils.hasText(s.getTypeCd()))     w.and(l.refTypeCd.eq(s.getTypeCd()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
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

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhSendEmailLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.logId));    break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, l.logId));    break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  l.sendDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, l.sendDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, l.regDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyhSendEmailLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(l.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getTemplateId()   != null) { update.set(l.templateId,   entity.getTemplateId());   hasAny = true; }
        if (entity.getTemplateCode() != null) { update.set(l.templateCode, entity.getTemplateCode()); hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(l.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getUserId()       != null) { update.set(l.userId,       entity.getUserId());       hasAny = true; }
        if (entity.getFromAddr()     != null) { update.set(l.fromAddr,     entity.getFromAddr());     hasAny = true; }
        if (entity.getToAddr()       != null) { update.set(l.toAddr,       entity.getToAddr());       hasAny = true; }
        if (entity.getCcAddr()       != null) { update.set(l.ccAddr,       entity.getCcAddr());       hasAny = true; }
        if (entity.getBccAddr()      != null) { update.set(l.bccAddr,      entity.getBccAddr());      hasAny = true; }
        if (entity.getSubject()      != null) { update.set(l.subject,      entity.getSubject());      hasAny = true; }
        if (entity.getContent()      != null) { update.set(l.content,      entity.getContent());      hasAny = true; }
        if (entity.getParams()       != null) { update.set(l.params,       entity.getParams());       hasAny = true; }
        if (entity.getResultCd()     != null) { update.set(l.resultCd,     entity.getResultCd());     hasAny = true; }
        if (entity.getFailReason()   != null) { update.set(l.failReason,   entity.getFailReason());   hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(l.sendDate,     entity.getSendDate());     hasAny = true; }
        if (entity.getRefTypeCd()    != null) { update.set(l.refTypeCd,    entity.getRefTypeCd());    hasAny = true; }
        if (entity.getRefId()        != null) { update.set(l.refId,        entity.getRefId());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(l.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(l.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
