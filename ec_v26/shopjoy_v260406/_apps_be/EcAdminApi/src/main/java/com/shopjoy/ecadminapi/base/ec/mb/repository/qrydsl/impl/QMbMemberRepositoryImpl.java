package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRepository;
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

/** MbMember QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMbMemberRepositoryImpl implements QMbMemberRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbMember m     = QMbMember.mbMember;
    private static final QSySite   s     = QSySite.sySite;
    private static final QSyCode   cdGr  = new QSyCode("cd_gr");
    private static final QSyCode   cdMs  = new QSyCode("cd_ms");

    @Override
    public Optional<MbMemberDto.Item> selectById(String memberId) {
        MbMemberDto.Item dto = baseQuery()
                .where(m.memberId.eq(memberId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<MbMemberDto.Item> selectList(MbMemberDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public MbMemberDto.PageResponse selectPageList(MbMemberDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<MbMemberDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(m.count())
                .from(m)
                .where(where)
                .fetchOne();

        MbMemberDto.PageResponse res = new MbMemberDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 공용 base query */
    private JPAQuery<MbMemberDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberDto.Item.class,
                        m.memberId, m.siteId, m.loginId, m.memberNm, m.memberPhone,
                        m.memberGender, m.birthDate,
                        m.gradeCd, m.memberStatusCd, m.memberStatusCdBefore,
                        m.joinDate, m.lastLogin,
                        m.orderCount, m.totalPurchaseAmt, m.cacheBalanceAmt,
                        m.memberZipCode, m.memberAddr, m.memberAddrDetail, m.memberMemo,
                        m.regBy, m.regDate, m.updBy, m.updDate,
                        s.siteNm.as("siteNm"),
                        cdGr.codeLabel.as("gradeCdNm"),
                        cdMs.codeLabel.as("memberStatusCdNm")
                ))
                .from(m)
                .leftJoin(s).on(s.siteId.eq(m.siteId))
                .leftJoin(cdGr).on(cdGr.codeGrp.eq("MEMBER_GRADE").and(cdGr.codeValue.eq(m.gradeCd)))
                .leftJoin(cdMs).on(cdMs.codeGrp.eq("MEMBER_STATUS").and(cdMs.codeValue.eq(m.memberStatusCd)));
    }

    private BooleanBuilder buildCondition(MbMemberDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(m.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getMemberId())) w.and(m.memberId.eq(s.getMemberId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_member_id"))    or.or(m.memberId.likeIgnoreCase(pattern));
            if (all || types.contains("def_member_nm"))    or.or(m.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_login_id"))     or.or(m.loginId.likeIgnoreCase(pattern));
            if (all || types.contains("def_member_phone")) or.or(m.memberPhone.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "join_date":
                    w.and(m.joinDate.goe(start)).and(m.joinDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl));   break;
                case "upd_date":
                    w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl));   break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(MbMemberDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.joinDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  m.memberId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, m.memberId));  break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  m.memberNm));  break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, m.memberNm));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  m.joinDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, m.joinDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, m.joinDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(MbMember entity) {
        if (entity.getMemberId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getMemberStatusCd()       != null) { update.set(m.memberStatusCd,       entity.getMemberStatusCd());       hasAny = true; }
        if (entity.getMemberStatusCdBefore() != null) { update.set(m.memberStatusCdBefore, entity.getMemberStatusCdBefore()); hasAny = true; }
        if (entity.getGradeCd()              != null) { update.set(m.gradeCd,              entity.getGradeCd());              hasAny = true; }
        if (entity.getMemberNm()             != null) { update.set(m.memberNm,             entity.getMemberNm());             hasAny = true; }
        if (entity.getMemberPhone()          != null) { update.set(m.memberPhone,          entity.getMemberPhone());          hasAny = true; }
        if (entity.getMemberMemo()           != null) { update.set(m.memberMemo,           entity.getMemberMemo());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(m.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(m.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.memberId.eq(entity.getMemberId())).execute();
        return (int) affected;
    }
}
