package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbLike;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbLikeRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
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
public class QMbLikeRepositoryImpl implements QMbLikeRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbLike   l    = QMbLike.mbLike;
    private static final QSySite   ste  = QSySite.sySite;
    private static final QMbMember mem  = QMbMember.mbMember;
    private static final QPdProd   prd  = QPdProd.pdProd;
    private static final QSyCode   cdLt = new QSyCode("cd_ltt");

    /* 좋아요(찜) 키조회 */
    @Override
    public Optional<MbLikeDto.Item> selectById(String likeId) {
        return Optional.ofNullable(baseQuery().where(l.likeId.eq(likeId)).fetchOne());
    }

    /* 좋아요(찜) 목록조회 */
    @Override
    public List<MbLikeDto.Item> selectList(MbLikeDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbLikeDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 좋아요(찜) 페이지조회 */
    @Override
    public MbLikeDto.PageResponse selectPageList(MbLikeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbLikeDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbLikeDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(l.count()).from(l).where(where).fetchOne();

        MbLikeDto.PageResponse res = new MbLikeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 좋아요(찜) baseQuery */
    private JPAQuery<MbLikeDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbLikeDto.Item.class,
                        l.likeId, l.siteId, l.memberId, l.targetTypeCd, l.targetId,
                        l.regBy, l.regDate, l.updBy, l.updDate
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(mem).on(mem.memberId.eq(l.memberId))
                .leftJoin(prd).on(prd.prodId.eq(l.targetId))
                .leftJoin(cdLt).on(cdLt.codeGrp.eq("LIKE_TARGET_TYPE").and(cdLt.codeValue.eq(l.targetTypeCd)));
    }

    /* 좋아요(찜) buildCondition */
    private BooleanBuilder buildCondition(MbLikeDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))       w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLikeId()))       w.and(l.likeId.eq(s.getLikeId()));
        if (StringUtils.hasText(s.getMemberId()))     w.and(l.memberId.eq(s.getMemberId()));
        if (StringUtils.hasText(s.getTargetId()))     w.and(l.targetId.eq(s.getTargetId()));
        if (StringUtils.hasText(s.getTargetTypeCd())) w.and(l.targetTypeCd.eq(s.getTargetTypeCd()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl)); break;
                case "upd_date": w.and(l.updDate.goe(start)).and(l.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbLikeDto.Request s) {
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
                if ("likeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.likeId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.regDate));
                }
            }
        }
        return orders;
    }

    /* 좋아요(찜) 수정 */
    @Override
    public int updateSelective(MbLike entity) {
        if (entity.getLikeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;
        if (entity.getSiteId()       != null) { update.set(l.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(l.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(l.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(l.targetId,     entity.getTargetId());     hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(l.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(l.updDate,      entity.getUpdDate());      hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(l.likeId.eq(entity.getLikeId())).execute();
    }
}
