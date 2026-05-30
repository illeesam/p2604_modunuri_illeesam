package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveDto.Item> query = baseQuery().where(
                andSiteId(search),
                andSaveId(search),
                andDateRange(search),
                andSearchValue(search)
        );
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

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveDto.Item> query = baseQuery().where(
                andSiteId(search),
                andSaveId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(
                andSiteId(search),
                andSaveId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmSaveDto.PageResponse res = new PmSaveDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmSaveDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? s.siteId.eq(search.getSiteId()) : null;
    }

    /* saveId 정확 일치 */
    private BooleanExpression andSaveId(PmSaveDto.Request search) {
        return search != null && StringUtils.hasText(search.getSaveId())
                ? s.saveId.eq(search.getSaveId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmSaveDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return s.regDate.goe(start).and(s.regDate.lt(endExcl));
            case "upd_date": return s.updDate.goe(start).and(s.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmSaveDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", s.memberId, pattern);
        or = orLike(or, all, types, ",refId,", s.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", s.refTypeCd, pattern);
        or = orLike(or, all, types, ",saveId,", s.saveId, pattern);
        or = orLike(or, all, types, ",saveMemo,", s.saveMemo, pattern);
        or = orLike(or, all, types, ",saveTypeCd,", s.saveTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", s.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier<>(Order.ASC, s.saveId));
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
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.saveId));
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
