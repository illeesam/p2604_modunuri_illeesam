package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyVendorUser QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorUserRepositoryImpl implements QSyVendorUserRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyVendorUser u = QSyVendorUser.syVendorUser;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyUser usr = QSyUser.syUser;
    private static final QSyCode cdP = new QSyCode("cd_p");
    private static final QSyCode cdVms = new QSyCode("cd_vms");

    /* 업체 사용자 buildBaseQuery */
    private JPAQuery<SyVendorUserDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorUserDto.Item.class,
                        u.vendorUserId, u.siteId, u.vendorId, u.userId,
                        u.memberNm, u.positionCd, u.vendorUserDeptNm,
                        u.vendorUserPhone, u.vendorUserMobile, u.vendorUserEmail,
                        u.birthDate, u.isMain, u.authYn, u.joinDate, u.leaveDate,
                        u.vendorUserStatusCd, u.vendorUserRemark,
                        u.regBy, u.regDate, u.updBy, u.updDate,
                        vnd.vendorNm.as("vendorNm")
                ))
                .from(u)
                .leftJoin(ste).on(ste.siteId.eq(u.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(u.vendorId))
                .leftJoin(usr).on(usr.userId.eq(u.userId))
                .leftJoin(cdP).on(cdP.codeGrp.eq("POSITION").and(cdP.codeValue.eq(u.positionCd)))
                .leftJoin(cdVms).on(cdVms.codeGrp.eq("VENDOR_MEMBER_STATUS").and(cdVms.codeValue.eq(u.vendorUserStatusCd)));
    }

    /* 업체 사용자 키조회 */
    @Override
    public Optional<SyVendorUserDto.Item> selectById(String vendorUserId) {
        SyVendorUserDto.Item dto = buildBaseQuery()
                .where(u.vendorUserId.eq(vendorUserId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체 사용자 목록조회 */
    @Override
    public List<SyVendorUserDto.Item> selectList(SyVendorUserDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorUserDto.Item> query = buildBaseQuery().where(where);
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

    /* 업체 사용자 페이지조회 */
    @Override
    public SyVendorUserDto.PageResponse selectPageList(SyVendorUserDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorUserDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorUserDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(u.count()).from(u).where(where).fetchOne();

        SyVendorUserDto.PageResponse res = new SyVendorUserDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyVendorUserDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(u.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getVendorUserId())) w.and(u.vendorUserId.eq(s.getVendorUserId()));
        if (StringUtils.hasText(s.getUserId()))       w.and(u.userId.eq(s.getUserId()));
        if (StringUtils.hasText(s.getVendorId()))     w.and(u.vendorId.eq(s.getVendorId()));
        if (StringUtils.hasText(s.getStatus()))       w.and(u.vendorUserStatusCd.eq(s.getStatus()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_member_nm,"))           or.or(u.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_vendor_user_dept_nm,")) or.or(u.vendorUserDeptNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startD = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endExclD = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1);
            LocalDateTime start = startD.atStartOfDay();
            LocalDateTime endExcl = endExclD.atStartOfDay();
            switch (s.getDateType()) {
                case "join_date":
                    w.and(u.joinDate.goe(startD)).and(u.joinDate.lt(endExclD));
                    break;
                case "reg_date":
                    w.and(u.regDate.goe(start)).and(u.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(u.updDate.goe(start)).and(u.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(SyVendorUserDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorUserId".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.vendorUserId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.memberNm));
                } else if ("joinDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.joinDate));
                }
            }
        }
        return orders;
    }

    /* 업체 사용자 수정 */
    @Override
    public int updateSelective(SyVendorUser entity) {
        if (entity.getVendorUserId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(u.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getVendorId()           != null) { update.set(u.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getUserId()             != null) { update.set(u.userId,             entity.getUserId());             hasAny = true; }
        if (entity.getMemberNm()           != null) { update.set(u.memberNm,           entity.getMemberNm());           hasAny = true; }
        if (entity.getPositionCd()         != null) { update.set(u.positionCd,         entity.getPositionCd());         hasAny = true; }
        if (entity.getVendorUserDeptNm()   != null) { update.set(u.vendorUserDeptNm,   entity.getVendorUserDeptNm());   hasAny = true; }
        if (entity.getVendorUserPhone()    != null) { update.set(u.vendorUserPhone,    entity.getVendorUserPhone());    hasAny = true; }
        if (entity.getVendorUserMobile()   != null) { update.set(u.vendorUserMobile,   entity.getVendorUserMobile());   hasAny = true; }
        if (entity.getVendorUserEmail()    != null) { update.set(u.vendorUserEmail,    entity.getVendorUserEmail());    hasAny = true; }
        if (entity.getBirthDate()          != null) { update.set(u.birthDate,          entity.getBirthDate());          hasAny = true; }
        if (entity.getIsMain()             != null) { update.set(u.isMain,             entity.getIsMain());             hasAny = true; }
        if (entity.getAuthYn()             != null) { update.set(u.authYn,             entity.getAuthYn());             hasAny = true; }
        if (entity.getJoinDate()           != null) { update.set(u.joinDate,           entity.getJoinDate());           hasAny = true; }
        if (entity.getLeaveDate()          != null) { update.set(u.leaveDate,          entity.getLeaveDate());          hasAny = true; }
        if (entity.getVendorUserStatusCd() != null) { update.set(u.vendorUserStatusCd, entity.getVendorUserStatusCd()); hasAny = true; }
        if (entity.getVendorUserRemark()   != null) { update.set(u.vendorUserRemark,   entity.getVendorUserRemark());   hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(u.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(u.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(u.vendorUserId.eq(entity.getVendorUserId())).execute();
        return (int) affected;
    }
}
