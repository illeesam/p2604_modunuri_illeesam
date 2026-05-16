package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberAddrRepository;
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
public class QMbMemberAddrRepositoryImpl implements QMbMemberAddrRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbMemberAddr a   = QMbMemberAddr.mbMemberAddr;
    private static final QMbMember     mem = QMbMember.mbMember;
    private static final QSySite       ste = QSySite.sySite;

    /* 회원 주소 키조회 */
    @Override
    public Optional<MbMemberAddrDto.Item> selectById(String memberAddrId) {
        return Optional.ofNullable(baseQuery().where(a.memberAddrId.eq(memberAddrId)).fetchOne());
    }

    /* 회원 주소 목록조회 */
    @Override
    public List<MbMemberAddrDto.Item> selectList(MbMemberAddrDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberAddrDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 주소 페이지조회 */
    @Override
    public MbMemberAddrDto.PageResponse selectPageList(MbMemberAddrDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberAddrDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberAddrDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(where).fetchOne();

        MbMemberAddrDto.PageResponse res = new MbMemberAddrDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 회원 주소 baseQuery */
    private JPAQuery<MbMemberAddrDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberAddrDto.Item.class,
                        a.memberAddrId, a.memberId,
                        a.addrNm, a.recvNm, a.recvPhone,
                        a.zipCd.as("zipCode"),
                        a.addr, a.addrDetail,
                        a.isDefault.as("defaultYn"),
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(ste).on(ste.siteId.eq(a.siteId));
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(MbMemberAddrDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getMemberAddrId())) w.and(a.memberAddrId.eq(s.getMemberAddrId()));
        if (StringUtils.hasText(s.getMemberId()))     w.and(a.memberId.eq(s.getMemberId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_addr_nm,")) or.or(a.addrNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_recv_nm,")) or.or(a.recvNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(a.regDate.goe(start)).and(a.regDate.lt(endExcl)); break;
                case "upd_date": w.and(a.updDate.goe(start)).and(a.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberAddrDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberAddrId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.memberAddrId));
                } else if ("addrNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.addrNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        return orders;
    }

    /* 회원 주소 수정 */
    @Override
    public int updateSelective(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;
        if (entity.getSiteId()     != null) { update.set(a.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getMemberId()   != null) { update.set(a.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getAddrNm()     != null) { update.set(a.addrNm,     entity.getAddrNm());     hasAny = true; }
        if (entity.getRecvNm()     != null) { update.set(a.recvNm,     entity.getRecvNm());     hasAny = true; }
        if (entity.getRecvPhone()  != null) { update.set(a.recvPhone,  entity.getRecvPhone());  hasAny = true; }
        if (entity.getZipCd()      != null) { update.set(a.zipCd,      entity.getZipCd());      hasAny = true; }
        if (entity.getAddr()       != null) { update.set(a.addr,       entity.getAddr());       hasAny = true; }
        if (entity.getAddrDetail() != null) { update.set(a.addrDetail, entity.getAddrDetail()); hasAny = true; }
        if (entity.getIsDefault()  != null) { update.set(a.isDefault,  entity.getIsDefault());  hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(a.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(a.updDate,    entity.getUpdDate());    hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(a.memberAddrId.eq(entity.getMemberAddrId())).execute();
    }
}
