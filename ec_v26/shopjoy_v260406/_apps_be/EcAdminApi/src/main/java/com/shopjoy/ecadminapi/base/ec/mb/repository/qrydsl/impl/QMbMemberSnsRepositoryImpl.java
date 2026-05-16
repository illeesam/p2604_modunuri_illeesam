package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberSnsRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QMbMemberSnsRepositoryImpl implements QMbMemberSnsRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbMemberSns m    = QMbMemberSns.mbMemberSns;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QSyCode      cdSc = new QSyCode("cd_sc");

    /* SNS 연동 회원 키조회 */
    @Override
    public Optional<MbMemberSnsDto.Item> selectById(String memberSnsId) {
        return Optional.ofNullable(baseQuery().where(m.memberSnsId.eq(memberSnsId)).fetchOne());
    }

    /* SNS 연동 회원 목록조회 */
    @Override
    public List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberSnsDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* SNS 연동 회원 페이지조회 */
    @Override
    public MbMemberSnsDto.PageResponse selectPageList(MbMemberSnsDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberSnsDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberSnsDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(m.count()).from(m).where(where).fetchOne();

        MbMemberSnsDto.PageResponse res = new MbMemberSnsDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* SNS 연동 회원 baseQuery */
    private JPAQuery<MbMemberSnsDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberSnsDto.Item.class,
                        m.memberSnsId, m.memberId, m.snsChannelCd, m.snsUserId,
                        m.regBy, m.regDate
                ))
                .from(m)
                .leftJoin(mem).on(mem.memberId.eq(m.memberId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SNS_CHANNEL").and(cdSc.codeValue.eq(m.snsChannelCd)));
    }

    /* SNS 연동 회원 buildCondition */
    private BooleanBuilder buildCondition(MbMemberSnsDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (!CollectionUtils.isEmpty(s.getMemberIds())) w.and(m.memberId.in(s.getMemberIds()));
        if (StringUtils.hasText(s.getMemberId()))    w.and(m.memberId.eq(s.getMemberId()));
        if (StringUtils.hasText(s.getMemberSnsId())) w.and(m.memberSnsId.eq(s.getMemberSnsId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl)); break;
                case "upd_date": w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberSnsDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberSnsId".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.memberSnsId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.regDate));
                }
            }
        }
        return orders;
    }

    /* SNS 연동 회원 수정 */
    @Override
    public int updateSelective(MbMemberSns entity) {
        if (entity.getMemberSnsId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;
        if (entity.getMemberId()     != null) { update.set(m.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getSnsChannelCd() != null) { update.set(m.snsChannelCd, entity.getSnsChannelCd()); hasAny = true; }
        if (entity.getSnsUserId()    != null) { update.set(m.snsUserId,    entity.getSnsUserId());    hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(m.memberSnsId.eq(entity.getMemberSnsId())).execute();
    }
}
