package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAlarmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyAlarm QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAlarmRepositoryImpl implements QSyAlarmRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyAlarm a = QSyAlarm.syAlarm;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdAt = new QSyCode("cd_at");
    private static final QSyCode cdAc = new QSyCode("cd_ac");
    private static final QSyCode cdAtt = new QSyCode("cd_att");

    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyAlarmDto.Item> selectById(String alarmId) {
        SyAlarmDto.Item dto = baseQuery().where(a.alarmId.eq(alarmId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyAlarmDto.Item> selectList(SyAlarmDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyAlarmDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyAlarmDto.PageResponse selectPageList(SyAlarmDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyAlarmDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyAlarmDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(where).fetchOne();

        SyAlarmDto.PageResponse res = new SyAlarmDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyAlarmDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyAlarmDto.Item.class,
                        a.alarmId, a.siteId, a.alarmTitle, a.alarmTypeCd, a.channelCd,
                        a.targetTypeCd, a.targetId, a.templateId, a.alarmMsg, a.alarmSendDate,
                        a.alarmStatusCd, a.alarmSendCount, a.alarmFailCount, a.pathId,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        cdAt.codeLabel.as("alarmTypeCdNm"),
                        cdAc.codeLabel.as("channelCdNm"),
                        cdAtt.codeLabel.as("targetTypeCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("ALARM_TYPE").and(cdAt.codeValue.eq(a.alarmTypeCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ALARM_CHANNEL").and(cdAc.codeValue.eq(a.channelCd)))
                .leftJoin(cdAtt).on(cdAtt.codeGrp.eq("ALARM_TARGET_TYPE").and(cdAtt.codeValue.eq(a.targetTypeCd)));
    }

    private BooleanBuilder buildCondition(SyAlarmDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(a.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getAlarmId()))  w.and(a.alarmId.eq(s.getAlarmId()));
        if (StringUtils.hasText(s.getPathId()))   w.and(a.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getStatus()))   w.and(a.alarmStatusCd.eq(s.getStatus()));
        if (StringUtils.hasText(s.getTypeCd()))   w.and(a.alarmTypeCd.eq(s.getTypeCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_title"))  or.or(a.alarmTitle.likeIgnoreCase(pattern));
            if (all || types.contains("def_typeCd")) or.or(a.alarmTypeCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "alarm_send_date":
                    w.and(a.alarmSendDate.goe(ds.atStartOfDay())).and(a.alarmSendDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "reg_date":
                    w.and(a.regDate.goe(ds.atStartOfDay())).and(a.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(a.updDate.goe(ds.atStartOfDay())).and(a.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyAlarmDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  a.alarmId));       break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, a.alarmId));       break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  a.alarmTitle));    break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, a.alarmTitle));    break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  a.alarmSendDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, a.alarmSendDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, a.regDate));       break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyAlarm entity) {
        if (entity.getAlarmId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(a.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getAlarmTitle()     != null) { update.set(a.alarmTitle,     entity.getAlarmTitle());     hasAny = true; }
        if (entity.getAlarmTypeCd()    != null) { update.set(a.alarmTypeCd,    entity.getAlarmTypeCd());    hasAny = true; }
        if (entity.getChannelCd()      != null) { update.set(a.channelCd,      entity.getChannelCd());      hasAny = true; }
        if (entity.getTargetTypeCd()   != null) { update.set(a.targetTypeCd,   entity.getTargetTypeCd());   hasAny = true; }
        if (entity.getTargetId()       != null) { update.set(a.targetId,       entity.getTargetId());       hasAny = true; }
        if (entity.getTemplateId()     != null) { update.set(a.templateId,     entity.getTemplateId());     hasAny = true; }
        if (entity.getAlarmMsg()       != null) { update.set(a.alarmMsg,       entity.getAlarmMsg());       hasAny = true; }
        if (entity.getAlarmSendDate()  != null) { update.set(a.alarmSendDate,  entity.getAlarmSendDate());  hasAny = true; }
        if (entity.getAlarmStatusCd()  != null) { update.set(a.alarmStatusCd,  entity.getAlarmStatusCd());  hasAny = true; }
        if (entity.getAlarmSendCount() != null) { update.set(a.alarmSendCount, entity.getAlarmSendCount()); hasAny = true; }
        if (entity.getAlarmFailCount() != null) { update.set(a.alarmFailCount, entity.getAlarmFailCount()); hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(a.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(a.updDate,        entity.getUpdDate());        hasAny = true; }
        if (entity.getPathId()         != null) { update.set(a.pathId,         entity.getPathId());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.alarmId.eq(entity.getAlarmId())).execute();
        return (int) affected;
    }
}
