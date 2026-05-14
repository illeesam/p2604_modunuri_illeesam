package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserLoginLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhUserLoginLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhUserLoginLogRepositoryImpl implements QSyhUserLoginLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhUserLoginLog l   = QSyhUserLoginLog.syhUserLoginLog;
    private static final QSySite          ste = QSySite.sySite;
    private static final QSyUser          usr = QSyUser.syUser;
    private static final QSyCode          cd_lr = new QSyCode("cd_lr");

    private JPAQuery<SyhUserLoginLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserLoginLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.userId,
                        l.loginId,
                        l.loginDate,
                        l.resultCd,
                        l.failCnt,
                        l.ip,
                        l.device,
                        l.os,
                        l.browser,
                        l.accessToken,
                        l.accessTokenExp,
                        l.refreshToken,
                        l.refreshTokenExp,
                        l.uiNm,
                        l.cmdNm,
                        l.regBy,
                        l.regDate,
                        l.updBy,
                        l.updDate,
                        ste.siteNm.as("siteNm"),
                        usr.userNm.as("userNm"),
                        cd_lr.codeLabel.as("resultCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(usr).on(usr.userId.eq(l.userId))
                .leftJoin(cd_lr).on(cd_lr.codeGrp.eq("LOGIN_RESULT").and(cd_lr.codeValue.eq(l.resultCd)));
    }

    @Override
    public Optional<SyhUserLoginLogDto.Item> selectById(String id) {
        SyhUserLoginLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyhUserLoginLogDto.Item> selectList(SyhUserLoginLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserLoginLogDto.Item> query = buildBaseQuery().where(where);
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
    public SyhUserLoginLogDto.PageResponse selectPageList(SyhUserLoginLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserLoginLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhUserLoginLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhUserLoginLogDto.PageResponse res = new SyhUserLoginLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyhUserLoginLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))    w.and(l.logId.eq(s.getLogId()));
        if (StringUtils.hasText(s.getUserId()))   w.and(l.userId.eq(s.getUserId()));
        if (StringUtils.hasText(s.getResultCd())) w.and(l.resultCd.eq(s.getResultCd()));
        if (StringUtils.hasText(s.getIp()))       w.and(l.ip.like("%" + s.getIp() + "%"));
        if (StringUtils.hasText(s.getUiNm()))     w.and(l.uiNm.like("%" + s.getUiNm() + "%"));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_userId"))  or.or(l.userId.like(pattern));
            if (all || types.contains("def_loginId")) or.or(l.loginId.like(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhUserLoginLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.logId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, l.logId));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  l.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, l.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, l.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyhUserLoginLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(l.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getUserId()          != null) { update.set(l.userId,          entity.getUserId());          hasAny = true; }
        if (entity.getLoginId()         != null) { update.set(l.loginId,         entity.getLoginId());         hasAny = true; }
        if (entity.getLoginDate()       != null) { update.set(l.loginDate,       entity.getLoginDate());       hasAny = true; }
        if (entity.getResultCd()        != null) { update.set(l.resultCd,        entity.getResultCd());        hasAny = true; }
        if (entity.getFailCnt()         != null) { update.set(l.failCnt,         entity.getFailCnt());         hasAny = true; }
        if (entity.getIp()              != null) { update.set(l.ip,              entity.getIp());              hasAny = true; }
        if (entity.getDevice()          != null) { update.set(l.device,          entity.getDevice());          hasAny = true; }
        if (entity.getOs()              != null) { update.set(l.os,              entity.getOs());              hasAny = true; }
        if (entity.getBrowser()         != null) { update.set(l.browser,         entity.getBrowser());         hasAny = true; }
        if (entity.getAccessToken()     != null) { update.set(l.accessToken,     entity.getAccessToken());     hasAny = true; }
        if (entity.getAccessTokenExp()  != null) { update.set(l.accessTokenExp,  entity.getAccessTokenExp());  hasAny = true; }
        if (entity.getRefreshToken()    != null) { update.set(l.refreshToken,    entity.getRefreshToken());    hasAny = true; }
        if (entity.getRefreshTokenExp() != null) { update.set(l.refreshTokenExp, entity.getRefreshTokenExp()); hasAny = true; }
        if (entity.getUiNm()            != null) { update.set(l.uiNm,            entity.getUiNm());            hasAny = true; }
        if (entity.getCmdNm()           != null) { update.set(l.cmdNm,           entity.getCmdNm());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(l.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(l.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
