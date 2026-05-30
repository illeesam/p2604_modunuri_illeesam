package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyUser QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRepositoryImpl implements QSyUserRepository {

    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyDept syDept = QSyDept.syDept;
    private static final QSyRole syRole = QSyRole.syRole;
    private static final QSyCode syCode_userStatusCd = new QSyCode("code_userStatusCd");
    private static final QSyCode syCode_authMethodCd = new QSyCode("code_authMethodCd");

    /** 기본 쿼리 빌드 */
    private JPAQuery<SyUserDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyUserDto.Item.class,
                        syUser.userId,
                        syUser.siteId,
                        syUser.loginId,
                        syUser.loginPwdHash,
                        syUser.userNm,
                        syUser.userEmail,
                        syUser.userPhone,
                        syUser.deptId,
                        syUser.roleId,
                        syUser.userStatusCd,
                        syUser.lastLogin,
                        syUser.loginFailCnt,
                        syUser.userMemo,
                        syUser.regBy,
                        syUser.regDate,
                        syUser.updBy,
                        syUser.updDate,
                        syUser.authMethodCd,
                        syUser.lastLoginDate,
                        syUser.profileAttachId,
                        sySite.siteNm.as("siteNm"),
                        syDept.deptNm.as("deptNm"),
                        syRole.roleNm.as("roleNm"),
                        syCode_userStatusCd.codeLabel.as("userStatusCdNm"),
                        syCode_authMethodCd.codeLabel.as("authMethodCdNm")
                ))
                .from(syUser)
                .leftJoin(sySite).on(sySite.siteId.eq(syUser.siteId))
                .leftJoin(syDept).on(syDept.deptId.eq(syUser.deptId))
                .leftJoin(syRole).on(syRole.roleId.eq(syUser.roleId))
                .leftJoin(syCode_userStatusCd).on(syCode_userStatusCd.codeGrp.eq("USER_STATUS").and(syCode_userStatusCd.codeValue.eq(syUser.userStatusCd)))
                .leftJoin(syCode_authMethodCd).on(syCode_authMethodCd.codeGrp.eq("AUTH_METHOD").and(syCode_authMethodCd.codeValue.eq(syUser.authMethodCd)));
    }

    /** 단건 조회 */
    @Override
    public Optional<SyUserDto.Item> selectById(String userId) {
        SyUserDto.Item dto = buildBaseQuery()
                .where(syUser.userId.eq(userId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용. null 안전) */
    @Override
    public List<SyUserDto.Item> selectList(SyUserDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        var query = buildBaseQuery()
                .where(where);
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

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    @Override
    public SyUserDto.PageResponse selectPageList(SyUserDto.Request search) {
        int pageNo   = search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        var query = buildBaseQuery()
                .where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyUserDto.Item> content = query.offset(offset)
                .limit(limit)
                .fetch();

        Long total = queryFactory
                .select(syUser.count())
                .from(syUser)
                .where(where)
                .fetchOne();

        SyUserDto.PageResponse res = new SyUserDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 기준 전체 카운트 (스트리밍 export 시 안전 상한 검증용) */
    @Override
    public long selectCount(SyUserDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        Long total = queryFactory.select(syUser.count())
                .from(syUser)
                .where(where)
                .fetchOne();
        return total == null ? 0L : total;
    }

    /** 검색조건 빌드 — searchValue LIKE OR (Q-class StringPath 자동) + 기간 + 단일 비교조건. */
    private BooleanBuilder buildCondition(SyUserDto.Request s) {
        BooleanBuilder b = new BooleanBuilder();
        if (s == null) return b;

        if (StringUtils.hasText(s.getSiteId())) b.and(syUser.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDeptId())) b.and(syUser.deptId.in(syDeptRepository.findTreeDeptIds(s.getDeptId())));
        if (StringUtils.hasText(s.getStatus())) b.and(syUser.userStatusCd.eq(s.getStatus()));

        /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    b.and(syUser.regDate.goe(start)).and(syUser.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    b.and(syUser.updDate.goe(start)).and(syUser.updDate.lt(endExcl));
                    break;
                case "last_login_date":
                    b.and(syUser.lastLoginDate.goe(start)).and(syUser.lastLoginDate.lt(endExcl));
                    break;
                default: break;
            }
        }
        /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
        if (s != null && StringUtils.hasText(s.getSearchValue())) {
            String pattern = "%" + s.getSearchValue() + "%";
            String __typeRaw = s.getSearchType();
            boolean __all = !StringUtils.hasText(__typeRaw);
            String __types = __all ? "" : ("," + __typeRaw.trim() + ",");
            BooleanBuilder or = new BooleanBuilder();
            if (__all || __types.contains(",authMethodCd,")) or.or(syUser.authMethodCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",deptId,")) or.or(syUser.deptId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",loginId,")) or.or(syUser.loginId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",loginPwdHash,")) or.or(syUser.loginPwdHash.likeIgnoreCase(pattern));
            if (__all || __types.contains(",profileAttachId,")) or.or(syUser.profileAttachId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",roleId,")) or.or(syUser.roleId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",siteId,")) or.or(syUser.siteId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",userEmail,")) or.or(syUser.userEmail.likeIgnoreCase(pattern));
            if (__all || __types.contains(",userId,")) or.or(syUser.userId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",userMemo,")) or.or(syUser.userMemo.likeIgnoreCase(pattern));
            if (__all || __types.contains(",userNm,")) or.or(syUser.userNm.likeIgnoreCase(pattern));
            if (__all || __types.contains(",userPhone,")) or.or(syUser.userPhone.likeIgnoreCase(pattern));
            if (__all || __types.contains(",userStatusCd,")) or.or(syUser.userStatusCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) b.and(or);
        }
        return b;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyUserDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (StringUtils.hasText(sort)) {
            String[] sortParts = sort.split(",");
            for (String part : sortParts) {
                String trimmed = part.trim();
                String[] fieldAndDir = trimmed.split(" ");
                if (fieldAndDir.length == 2) {
                    String field = fieldAndDir[0];
                    String dir = fieldAndDir[1];
                    Order order = "desc".equalsIgnoreCase(dir) ? Order.DESC : Order.ASC;
                    if ("userId".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.userId));
                    } else if ("userNm".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.userNm));
                    } else if ("loginId".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.loginId));
                    } else if ("regDate".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.regDate));
                    } else if ("updDate".equals(field)) {
                        orders.add(new OrderSpecifier(order, syUser.updDate));
                    }
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        if (orders.isEmpty()) orders.add(new OrderSpecifier<>(Order.DESC, syUser.regDate));
        return orders;
    }

    /** updateSelective - null 이 아닌 필드만 UPDATE (MyBatis selective 대체) */
    @Override
    public int updateSelective(SyUser entity) {
        if (entity.getUserId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syUser);

        if (entity.getSiteId()          != null) update.set(syUser.siteId,          entity.getSiteId());
        if (entity.getLoginId()         != null) update.set(syUser.loginId,         entity.getLoginId());
        if (entity.getLoginPwdHash()    != null) update.set(syUser.loginPwdHash,    entity.getLoginPwdHash());
        if (entity.getUserNm()          != null) update.set(syUser.userNm,          entity.getUserNm());
        if (entity.getUserEmail()       != null) update.set(syUser.userEmail,       entity.getUserEmail());
        if (entity.getUserPhone()       != null) update.set(syUser.userPhone,       entity.getUserPhone());
        if (entity.getDeptId()          != null) update.set(syUser.deptId,          entity.getDeptId());
        if (entity.getRoleId()          != null) update.set(syUser.roleId,          entity.getRoleId());
        if (entity.getUserStatusCd()    != null) update.set(syUser.userStatusCd,    entity.getUserStatusCd());
        if (entity.getLastLogin()       != null) update.set(syUser.lastLogin,       entity.getLastLogin());
        if (entity.getLoginFailCnt()    != null) update.set(syUser.loginFailCnt,    entity.getLoginFailCnt());
        if (entity.getUserMemo()        != null) update.set(syUser.userMemo,        entity.getUserMemo());
        if (entity.getUpdBy()           != null) update.set(syUser.updBy,           entity.getUpdBy());
        if (entity.getUpdDate()         != null) update.set(syUser.updDate,         entity.getUpdDate());
        if (entity.getAuthMethodCd()    != null) update.set(syUser.authMethodCd,    entity.getAuthMethodCd());
        if (entity.getLastLoginDate()   != null) update.set(syUser.lastLoginDate,   entity.getLastLoginDate());
        if (entity.getProfileAttachId() != null) update.set(syUser.profileAttachId, entity.getProfileAttachId());

        long affected = update
                .where(syUser.userId.eq(entity.getUserId()))
                .execute();

        return (int) affected;
    }
}