package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachGrpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyAttachGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachGrpRepositoryImpl implements QSyAttachGrpRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAttachGrpRepositoryImpl";
    private static final QSyAttachGrp syAttachGrp = QSyAttachGrp.syAttachGrp;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 첨부파일 그룹 baseSelColumnQuery */
    private JPAQuery<SyAttachGrpDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachGrpDto.Item.class,
                        syAttachGrp.attachGrpId, syAttachGrp.attachGrpCode, syAttachGrp.attachGrpNm, syAttachGrp.fileExtAllow,
                        syAttachGrp.maxFileSize, syAttachGrp.maxFileCount, syAttachGrp.storagePath, syAttachGrp.useYn, syAttachGrp.sortOrd,
                        syAttachGrp.attachGrpRemark, syAttachGrp.regBy, syAttachGrp.regDate, syAttachGrp.updBy, syAttachGrp.updDate
                ))
                .from(syAttachGrp);
    }

    /* 첨부파일 그룹 키조회 */
    @Override
    public Optional<SyAttachGrpDto.Item> selectById(String attachGrpId) {
        SyAttachGrpDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syAttachGrp.attachGrpId.eq(attachGrpId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 첨부파일 그룹 목록조회 */
    @Override
    public List<SyAttachGrpDto.Item> selectList(SyAttachGrpDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyAttachGrpDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andAttachGrpIdEq(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 첨부파일 그룹 페이지조회 */
    @Override
    public SyAttachGrpDto.PageResponse selectPageData(SyAttachGrpDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andAttachGrpIdEq(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyAttachGrpDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyAttachGrpDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syAttachGrp.count())
                .where(wheres)
                .fetchOne();

        SyAttachGrpDto.PageResponse res = new SyAttachGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* attachGrpId 정확 일치 */
    private BooleanExpression andAttachGrpIdEq(SyAttachGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getAttachGrpId())
                ? syAttachGrp.attachGrpId.eq(search.getAttachGrpId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(SyAttachGrpDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachGrpCode,", syAttachGrp.attachGrpCode, pattern);
        or = orLike(or, all, types, ",attachGrpId,", syAttachGrp.attachGrpId, pattern);
        or = orLike(or, all, types, ",attachGrpNm,", syAttachGrp.attachGrpNm, pattern);
        or = orLike(or, all, types, ",attachGrpRemark,", syAttachGrp.attachGrpRemark, pattern);
        or = orLike(or, all, types, ",fileExtAllow,", syAttachGrp.fileExtAllow, pattern);
        or = orLike(or, all, types, ",siteId,", syAttachGrp.siteId, pattern);
        or = orLike(or, all, types, ",storagePath,", syAttachGrp.storagePath, pattern);
        or = orLike(or, all, types, ",useYn,", syAttachGrp.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyAttachGrpDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.attachGrpId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("attachGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAttachGrp.attachGrpId));
                } else if ("attachGrpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAttachGrp.attachGrpNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syAttachGrp.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syAttachGrp.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syAttachGrp.attachGrpId));
        }
        return orders;
    }

    /* 첨부파일 그룹 수정 */


    @Override
    public int updateSelective(SyAttachGrp entity) {
        if (entity.getAttachGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syAttachGrp);
        boolean hasAny = false;

        if (entity.getAttachGrpCode()   != null) { update.set(syAttachGrp.attachGrpCode,   entity.getAttachGrpCode());   hasAny = true; }
        if (entity.getAttachGrpNm()     != null) { update.set(syAttachGrp.attachGrpNm,     entity.getAttachGrpNm());     hasAny = true; }
        if (entity.getFileExtAllow()    != null) { update.set(syAttachGrp.fileExtAllow,    entity.getFileExtAllow());    hasAny = true; }
        if (entity.getMaxFileSize()     != null) { update.set(syAttachGrp.maxFileSize,     entity.getMaxFileSize());     hasAny = true; }
        if (entity.getMaxFileCount()    != null) { update.set(syAttachGrp.maxFileCount,    entity.getMaxFileCount());    hasAny = true; }
        if (entity.getStoragePath()     != null) { update.set(syAttachGrp.storagePath,     entity.getStoragePath());     hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(syAttachGrp.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(syAttachGrp.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getAttachGrpRemark() != null) { update.set(syAttachGrp.attachGrpRemark, entity.getAttachGrpRemark()); hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syAttachGrp.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syAttachGrp.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syAttachGrp.attachGrpId.eq(entity.getAttachGrpId())).execute();
        return (int) affected;
    }
}
