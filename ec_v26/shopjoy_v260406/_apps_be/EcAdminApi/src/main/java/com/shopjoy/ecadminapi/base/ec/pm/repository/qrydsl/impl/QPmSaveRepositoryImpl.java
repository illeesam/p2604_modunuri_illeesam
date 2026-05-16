package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSave;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveRepository;
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

/** PmSave QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveRepositoryImpl implements QPmSaveRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmSave   s    = QPmSave.pmSave;
    private static final QSySite   ste  = QSySite.sySite;
    private static final QMbMember mem  = QMbMember.mbMember;
    private static final QSyCode   cdSt = new QSyCode("cd_st");

    /* 적립금 baseQuery */
    private JPAQuery<PmSaveDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveDto.Item.class,
                        s.saveId, s.siteId, s.memberId, s.saveTypeCd, s.saveAmt,
                        s.balanceAmt, s.refTypeCd, s.refId, s.expireDate, s.saveMemo,
                        s.regBy, s.regDate
                ))
                .from(s)
                .leftJoin(ste).on(ste.siteId.eq(s.siteId))
                .leftJoin(mem).on(mem.memberId.eq(s.memberId))
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SAVE_TYPE").and(cdSt.codeValue.eq(s.saveTypeCd)));
    }

    /* 적립금 키조회 */
    @Override
    public Optional<PmSaveDto.Item> selectById(String saveId) {
        PmSaveDto.Item dto = baseQuery()
                .where(s.saveId.eq(saveId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 목록조회 */
    @Override
    public List<PmSaveDto.Item> selectList(PmSaveDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveDto.Item> query = baseQuery().where(where);
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

    /* 적립금 페이지조회 */
    @Override
    public PmSaveDto.PageResponse selectPageList(PmSaveDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(where)
                .fetchOne();

        PmSaveDto.PageResponse res = new PmSaveDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 buildCondition */
    private BooleanBuilder buildCondition(PmSaveDto.Request search) {
        BooleanBuilder w = new BooleanBuilder();
        if (search == null) return w;

        if (StringUtils.hasText(search.getSiteId())) w.and(s.siteId.eq(search.getSiteId()));
        if (StringUtils.hasText(search.getSaveId())) w.and(s.saveId.eq(search.getSaveId()));

        if (StringUtils.hasText(search.getDateType())
                && StringUtils.hasText(search.getDateStart())
                && StringUtils.hasText(search.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (search.getDateType()) {
                case "reg_date":
                    w.and(s.regDate.goe(start)).and(s.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(s.updDate.goe(start)).and(s.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PmSaveDto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("saveId".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.saveId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        return orders;
    }

    /* 적립금 수정 */
    @Override
    public int updateSelective(PmSave entity) {
        if (entity.getSaveId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(s.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getMemberId()   != null) { update.set(s.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getSaveTypeCd() != null) { update.set(s.saveTypeCd, entity.getSaveTypeCd()); hasAny = true; }
        if (entity.getSaveAmt()    != null) { update.set(s.saveAmt,    entity.getSaveAmt());    hasAny = true; }
        if (entity.getBalanceAmt() != null) { update.set(s.balanceAmt, entity.getBalanceAmt()); hasAny = true; }
        if (entity.getRefTypeCd()  != null) { update.set(s.refTypeCd,  entity.getRefTypeCd());  hasAny = true; }
        if (entity.getRefId()      != null) { update.set(s.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getExpireDate() != null) { update.set(s.expireDate, entity.getExpireDate()); hasAny = true; }
        if (entity.getSaveMemo()   != null) { update.set(s.saveMemo,   entity.getSaveMemo());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.saveId.eq(entity.getSaveId())).execute();
        return (int) affected;
    }
}
