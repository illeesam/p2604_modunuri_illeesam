package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendMsgLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhSendMsgLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhSendMsgLogRepositoryImpl implements QSyhSendMsgLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhSendMsgLog l   = QSyhSendMsgLog.syhSendMsgLog;
    private static final QSySite        ste = QSySite.sySite;
    private static final QSyTemplate    tpl = QSyTemplate.syTemplate;
    private static final QSyUser        usr = QSyUser.syUser;
    private static final QSyCode        cd_mc = new QSyCode("cd_mc");
    private static final QSyCode        cd_sr = new QSyCode("cd_sr");

    private JPAQuery<SyhSendMsgLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendMsgLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.channelCd,
                        l.templateId,
                        l.templateCode,
                        l.memberId,
                        l.userId,
                        l.recvPhone,
                        l.deviceToken,
                        l.senderPhone,
                        l.title,
                        l.content,
                        l.params,
                        l.kakaoTplCode,
                        l.resultCd,
                        l.resultMsg,
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
                        cd_mc.codeLabel.as("channelCdNm"),
                        cd_sr.codeLabel.as("resultCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(tpl).on(tpl.templateId.eq(l.templateId))
                .leftJoin(usr).on(usr.userId.eq(l.userId))
                .leftJoin(cd_mc).on(cd_mc.codeGrp.eq("MSG_CHANNEL").and(cd_mc.codeValue.eq(l.channelCd)))
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(l.resultCd)));
    }

    @Override
    public Optional<SyhSendMsgLogDto.Item> selectById(String id) {
        SyhSendMsgLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendMsgLogDto.Item> query = buildBaseQuery().where(where);
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
    public SyhSendMsgLogDto.PageResponse selectPageList(SyhSendMsgLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendMsgLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhSendMsgLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhSendMsgLogDto.PageResponse res = new SyhSendMsgLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyhSendMsgLogDto.Request s) {
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
    private List<OrderSpecifier<?>> buildOrder(SyhSendMsgLogDto.Request s) {
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
    public int updateSelective(SyhSendMsgLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(l.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getChannelCd()    != null) { update.set(l.channelCd,    entity.getChannelCd());    hasAny = true; }
        if (entity.getTemplateId()   != null) { update.set(l.templateId,   entity.getTemplateId());   hasAny = true; }
        if (entity.getTemplateCode() != null) { update.set(l.templateCode, entity.getTemplateCode()); hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(l.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getUserId()       != null) { update.set(l.userId,       entity.getUserId());       hasAny = true; }
        if (entity.getRecvPhone()    != null) { update.set(l.recvPhone,    entity.getRecvPhone());    hasAny = true; }
        if (entity.getDeviceToken()  != null) { update.set(l.deviceToken,  entity.getDeviceToken());  hasAny = true; }
        if (entity.getSenderPhone()  != null) { update.set(l.senderPhone,  entity.getSenderPhone());  hasAny = true; }
        if (entity.getTitle()        != null) { update.set(l.title,        entity.getTitle());        hasAny = true; }
        if (entity.getContent()      != null) { update.set(l.content,      entity.getContent());      hasAny = true; }
        if (entity.getParams()       != null) { update.set(l.params,       entity.getParams());       hasAny = true; }
        if (entity.getKakaoTplCode() != null) { update.set(l.kakaoTplCode, entity.getKakaoTplCode()); hasAny = true; }
        if (entity.getResultCd()     != null) { update.set(l.resultCd,     entity.getResultCd());     hasAny = true; }
        if (entity.getResultMsg()    != null) { update.set(l.resultMsg,    entity.getResultMsg());    hasAny = true; }
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
