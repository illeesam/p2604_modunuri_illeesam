package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberTokenLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QMbhMemberTokenLogRepositoryImpl implements QMbhMemberTokenLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbhMemberTokenLog l    = QMbhMemberTokenLog.mbhMemberTokenLog;
    private static final QSySite            ste  = QSySite.sySite;
    private static final QMbMember          mem  = QMbMember.mbMember;
    private static final QSyCode            cdTa = new QSyCode("cd_ta");
    private static final QSyCode            cdTt = new QSyCode("cd_tt");

    @Override
    public Optional<MbhMemberTokenLogDto.Item> selectById(String logId) {
        return Optional.ofNullable(baseQuery().where(l.logId.eq(logId)).fetchOne());
    }

    @Override
    public List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public MbhMemberTokenLogDto.PageResponse selectPageList(MbhMemberTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbhMemberTokenLogDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbhMemberTokenLogDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(l.count()).from(l).where(where).fetchOne();

        MbhMemberTokenLogDto.PageResponse res = new MbhMemberTokenLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<MbhMemberTokenLogDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberTokenLogDto.Item.class,
                        l.logId, l.siteId, l.memberId, l.loginLogId,
                        l.actionCd, l.tokenTypeCd,
                        l.accessToken, l.tokenExp, l.prevToken, l.refreshToken,
                        l.ip, l.deviceInfo, l.revokeReason, l.accessTokenExp,
                        l.uiNm, l.cmdNm,
                        l.regBy, l.regDate, l.updBy, l.updDate,
                        ste.siteNm.as("siteNm"),
                        mem.memberNm.as("memberNm"),
                        cdTa.codeLabel.as("actionCdNm"),
                        cdTt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(mem).on(mem.memberId.eq(l.memberId))
                .leftJoin(cdTa).on(cdTa.codeGrp.eq("TOKEN_ACTION").and(cdTa.codeValue.eq(l.actionCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("TOKEN_TYPE").and(cdTt.codeValue.eq(l.tokenTypeCd)));
    }

    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(MbhMemberTokenLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId())) w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))  w.and(l.logId.eq(s.getLogId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_member_id,")) or.or(l.memberId.likeIgnoreCase(pattern));
            // def_login_id: l.login_id 컬럼이 엔티티에 없으므로 생략
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbhMemberTokenLogDto.Request s) {
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

    @Override
    public int updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(l.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getAuthId()         != null) { update.set(l.authId,         entity.getAuthId());         hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(l.memberId,       entity.getMemberId());       hasAny = true; }
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
        return (int) update.where(l.logId.eq(entity.getLogId())).execute();
    }
}
