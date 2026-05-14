package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyUser QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserRepositoryImpl implements QSyUserRepository {

    private final JPAQueryFactory queryFactory;
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
                        Expressions.stringTemplate("to_char({0}, 'YYYYMMDDHH24MISS')", syUser.regDate).as("regDate"),
                        syUser.updBy,
                        Expressions.stringTemplate("to_char({0}, 'YYYYMMDDHH24MISS')", syUser.updDate).as("updDate"),
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

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<SyUserDto.Item> selectList(SyUserDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        var query = buildBaseQuery()
                .where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        if (search.getPageSize() > 0 && search.getPageNo() > 0) {
            int offset = (search.getPageNo() - 1) * search.getPageSize();
            int limit  = search.getPageSize();
            query.offset(offset).limit(limit);
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

    /** 검색조건 빌드 */
    private BooleanBuilder buildCondition(SyUserDto.Request s) {
        BooleanBuilder b = new BooleanBuilder();
        if (StringUtils.hasText(s.getSiteId())) b.and(syUser.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDeptId())) b.and(syUser.deptId.eq(s.getDeptId()));
        if (StringUtils.hasText(s.getStatus())) b.and(syUser.userStatusCd.eq(s.getStatus()));
        // 추가 검색 조건은 MyBatis처럼 복잡하므로 간단히 구현. 필요시 확장// 1. siteId 조건 (exists 사용)
        // if (StringUtils.hasText(s.getSiteId())) {
        //     b.and(JPAExpressions
        //             .selectOne()
        //             .from(sySite)
        //             .where(sySite.siteId.eq(syUser.siteId)
        //                     .and(sySite.siteId.eq(s.getSiteId())))
        //             .exists());
        // }

        // // 2. deptId 조건 (exists 사용)
        // if (StringUtils.hasText(s.getDeptId())) {
        //     b.and(JPAExpressions
        //             .selectOne()
        //             .from(syDept)
        //             .where(syDept.deptId.eq(syUser.deptId)
        //                     .and(syDept.deptId.eq(s.getDeptId())))
        //             .exists());
        // }

        // // 3. status 조건 (단일 테이블 내 exists 혹은 eq)
        // // userStatusCd는 syUser의 컬럼이므로 exists로 돌리려면 자기 자신을 조회하거나 
        // // 공통 코드 테이블(syCode) 기준으로 체크해야 합니다.
        // if (StringUtils.hasText(s.getStatus())) {
        //     b.and(JPAExpressions
        //             .selectOne()
        //             .from(syCode_userStatusCd)
        //             .where(syCode_userStatusCd.codeGrp.eq("USER_STATUS")
        //                     .and(syCode_userStatusCd.codeValue.eq(syUser.userStatusCd))
        //                     .and(syCode_userStatusCd.codeValue.eq(s.getStatus())))
        //             .exists());
        // }
        return b;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(SyUserDto.Request s) {
        if (!StringUtils.hasText(s.getSort())) return new ArrayList<>();
        String[] sortParts = s.getSort().split(",");
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                String dir = fieldAndDir[1];
                Order order = "desc".equalsIgnoreCase(dir) ? Order.DESC : Order.ASC;
                switch (field) {
                    case "userId":
                        orders.add(new OrderSpecifier(order, syUser.userId));
                        break;
                    case "userNm":
                        orders.add(new OrderSpecifier(order, syUser.userNm));
                        break;
                    case "loginId":
                        orders.add(new OrderSpecifier(order, syUser.loginId));
                        break;
                    case "regDate":
                        orders.add(new OrderSpecifier(order, syUser.regDate));
                        break;
                    case "updDate":
                        orders.add(new OrderSpecifier(order, syUser.updDate));
                        break;
                    default:
                        // 기본 정렬 없음
                        break;
                }
            }
        }
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