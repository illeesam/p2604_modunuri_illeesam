package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserTokenLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhUserTokenLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhUserTokenLogRepositoryImpl implements QSyhUserTokenLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhUserTokenLog l   = QSyhUserTokenLog.syhUserTokenLog;
    private static final QSySite          ste = QSySite.sySite;
    private static final QSyUser          usr = QSyUser.syUser;
    private static final QSyCode          cd_ta = new QSyCode("cd_ta");
    private static final QSyCode          cd_tt = new QSyCode("cd_tt");

    /* buildBaseQuery */
    private JPAQuery<SyhUserTokenLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserTokenLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.userId,
                        l.loginLogId,
                        l.actionCd,
                        l.tokenTypeCd,
                        l.accessToken,
                        l.tokenExp,
                        l.prevToken,
                        l.refreshToken,
                        l.ip,
                        l.deviceInfo,
                        l.revokeReason,
                        l.accessTokenExp,
                        l.uiNm,
                        l.cmdNm,
                        l.regBy,
                        l.regDate,
                        l.updBy,
                        l.updDate,
                        ste.siteNm.as("siteNm"),
                        usr.userNm.as("userNm"),
                        cd_ta.codeLabel.as("actionCdNm"),
                        cd_tt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(usr).on(usr.userId.eq(l.userId))
                .leftJoin(cd_ta).on(cd_ta.codeGrp.eq("TOKEN_ACTION").and(cd_ta.codeValue.eq(l.actionCd)))
                .leftJoin(cd_tt).on(cd_tt.codeGrp.eq("TOKEN_TYPE").and(cd_tt.codeValue.eq(l.tokenTypeCd)));
    }

    /* 키조회 */
    @Override
    public Optional<SyhUserTokenLogDto.Item> selectById(String id) {
        SyhUserTokenLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserTokenLogDto.Item> query = buildBaseQuery().where(where);
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

    /* 페이지조회 */
    @Override
    public SyhUserTokenLogDto.PageResponse selectPageList(SyhUserTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserTokenLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhUserTokenLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhUserTokenLogDto.PageResponse res = new SyhUserTokenLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyhUserTokenLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))       w.and(l.logId.eq(s.getLogId()));
        if (StringUtils.hasText(s.getUserId()))      w.and(l.userId.eq(s.getUserId()));
        if (StringUtils.hasText(s.getActionCd()))    w.and(l.actionCd.eq(s.getActionCd()));
        if (StringUtils.hasText(s.getTokenTypeCd())) w.and(l.tokenTypeCd.eq(s.getTokenTypeCd()));
        if (StringUtils.hasText(s.getIp()))          w.and(l.ip.like("%" + s.getIp() + "%"));
        if (StringUtils.hasText(s.getUiNm()))        w.and(l.uiNm.like("%" + s.getUiNm() + "%"));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_userId,"))  or.or(l.userId.like(pattern));
            // login_id 컬럼이 SyhUserTokenLog 엔티티에 없음 — XML 의 login_id 검색은 생략
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

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhUserTokenLogDto.Request s) {
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
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.regDate));
                }
            }
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(SyhUserTokenLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(l.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getUserId()         != null) { update.set(l.userId,         entity.getUserId());         hasAny = true; }
        if (entity.getLoginLogId()     != null) { update.set(l.loginLogId,     entity.getLoginLogId());     hasAny = true; }
        if (entity.getActionCd()       != null) { update.set(l.actionCd,       entity.getActionCd());       hasAny = true; }
        if (entity.getTokenTypeCd()    != null) { update.set(l.tokenTypeCd,    entity.getTokenTypeCd());    hasAny = true; }
        if (entity.getAccessToken()    != null) { update.set(l.accessToken,    entity.getAccessToken());    hasAny = true; }
        if (entity.getTokenExp()       != null) { update.set(l.tokenExp,       entity.getTokenExp());       hasAny = true; }
        if (entity.getPrevToken()      != null) { update.set(l.prevToken,      entity.getPrevToken());      hasAny = true; }
        if (entity.getRefreshToken()   != null) { update.set(l.refreshToken,   entity.getRefreshToken());   hasAny = true; }
        if (entity.getIp()             != null) { update.set(l.ip,             entity.getIp());             hasAny = true; }
        if (entity.getDeviceInfo()     != null) { update.set(l.deviceInfo,     entity.getDeviceInfo());     hasAny = true; }
        if (entity.getRevokeReason()   != null) { update.set(l.revokeReason,   entity.getRevokeReason());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(l.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(l.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(l.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(l.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(l.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
