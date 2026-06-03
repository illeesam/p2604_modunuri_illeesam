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
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveRepositoryImpl";
    private static final QPmSave   pmSave    = QPmSave.pmSave;
    private static final QSySite   sySite  = QSySite.sySite;
    private static final QMbMember mbMember  = QMbMember.mbMember;
    private static final QSyCode   cdSt = new QSyCode("cd_st");

    /* 적립금 baseSelColumnQuery */
    private JPAQuery<PmSaveDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveDto.Item.class,
                        pmSave.saveId, pmSave.siteId, pmSave.memberId, pmSave.saveTypeCd, pmSave.saveAmt,
                        pmSave.balanceAmt, pmSave.refTypeCd, pmSave.refId, pmSave.expireDate, pmSave.saveMemo,
                        pmSave.regBy, pmSave.regDate
                ))
                .from(pmSave)
                .leftJoin(sySite).on(sySite.siteId.eq(pmSave.siteId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(pmSave.memberId))
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SAVE_TYPE").and(cdSt.codeValue.eq(pmSave.saveTypeCd)));
    }

    /* 적립금 키조회 */
    @Override
    public Optional<PmSaveDto.Item> selectById(String saveId) {
        PmSaveDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSave.saveId.eq(saveId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 목록조회 */
    @Override
    public List<PmSaveDto.Item> selectList(PmSaveDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndSaveId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 적립금 페이지조회 */
    @Override
    public PmSaveDto.PageResponse selectPageData(PmSaveDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndSaveId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmSaveDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmSaveDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSave.count())
                .where(wheres)
                .fetchOne();

        PmSaveDto.PageResponse res = new PmSaveDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(a), andDeptId(a), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmSaveDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmSave.siteId.eq(search.getSiteId()) : null;
    }

    /* saveId 정확 일치 */
    private BooleanExpression baseAndSaveId(PmSaveDto.Request search) {
        return search != null && StringUtils.hasText(search.getSaveId())
                ? pmSave.saveId.eq(search.getSaveId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmSaveDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmSave.regDate.goe(start).and(pmSave.regDate.lt(endExcl));
            case "upd_date": return pmSave.updDate.goe(start).and(pmSave.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmSaveDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", pmSave.memberId, pattern);
        or = orLike(or, all, types, ",refId,", pmSave.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", pmSave.refTypeCd, pattern);
        or = orLike(or, all, types, ",saveId,", pmSave.saveId, pattern);
        or = orLike(or, all, types, ",saveMemo,", pmSave.saveMemo, pattern);
        or = orLike(or, all, types, ",saveTypeCd,", pmSave.saveTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", pmSave.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, pmSave.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmSave.saveId));
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
                    orders.add(new OrderSpecifier(order, pmSave.saveId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmSave.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmSave.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmSave.saveId));
        }
        return orders;
    }

    /* 적립금 수정 */
    @Override
    public int updateSelective(PmSave entity) {
        if (entity.getSaveId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSave);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(pmSave.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getMemberId()   != null) { update.set(pmSave.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getSaveTypeCd() != null) { update.set(pmSave.saveTypeCd, entity.getSaveTypeCd()); hasAny = true; }
        if (entity.getSaveAmt()    != null) { update.set(pmSave.saveAmt,    entity.getSaveAmt());    hasAny = true; }
        if (entity.getBalanceAmt() != null) { update.set(pmSave.balanceAmt, entity.getBalanceAmt()); hasAny = true; }
        if (entity.getRefTypeCd()  != null) { update.set(pmSave.refTypeCd,  entity.getRefTypeCd());  hasAny = true; }
        if (entity.getRefId()      != null) { update.set(pmSave.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getExpireDate() != null) { update.set(pmSave.expireDate, entity.getExpireDate()); hasAny = true; }
        if (entity.getSaveMemo()   != null) { update.set(pmSave.saveMemo,   entity.getSaveMemo());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmSave.saveId.eq(entity.getSaveId())).execute();
        return (int) affected;
    }
}
