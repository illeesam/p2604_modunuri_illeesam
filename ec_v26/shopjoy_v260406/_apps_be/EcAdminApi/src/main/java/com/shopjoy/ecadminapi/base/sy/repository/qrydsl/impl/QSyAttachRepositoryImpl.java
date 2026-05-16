package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttach;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyAttach QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachRepositoryImpl implements QSyAttachRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyAttach a = QSyAttach.syAttach;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyAttachDto.Item> selectById(String attachId) {
        SyAttachDto.Item dto = baseQuery().where(a.attachId.eq(attachId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyAttachDto.Item> selectList(SyAttachDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search, false);
        JPAQuery<SyAttachDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyAttachDto.PageResponse selectPageList(SyAttachDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search, true);

        JPAQuery<SyAttachDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyAttachDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(where).fetchOne();

        SyAttachDto.PageResponse res = new SyAttachDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyAttachDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachDto.Item.class,
                        a.attachId, a.siteId, a.attachGrpId, a.fileNm, a.fileSize, a.fileExt,
                        a.mimeTypeCd, a.storedNm, a.attachUrl, a.storagePath, a.physicalPath,
                        a.cdnHost, a.cdnImgUrl, a.cdnThumbUrl, a.thumbFileNm, a.thumbStoredNm,
                        a.thumbUrl, a.thumbCdnUrl, a.thumbGeneratedYn, a.sortOrd, a.attachMemo,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId));
    }

    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(SyAttachDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(a.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getAttachId()))    w.and(a.attachId.eq(s.getAttachId()));
        if (StringUtils.hasText(s.getAttachGrpId())) w.and(a.attachGrpId.eq(s.getAttachGrpId()));
        if (StringUtils.hasText(s.getMimeTypeCd()))  w.and(a.mimeTypeCd.eq(s.getMimeTypeCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_file_nm,"))   or.or(a.fileNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_stored_nm,")) or.or(a.storedNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(a.regDate.goe(ds.atStartOfDay())).and(a.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(a.updDate.goe(ds.atStartOfDay())).and(a.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
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
    private List<OrderSpecifier<?>> buildOrder(SyAttachDto.Request s, boolean forPage) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            if (forPage) {
                orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            } else {
                orders.add(new OrderSpecifier(Order.ASC, a.sortOrd));
                orders.add(new OrderSpecifier(Order.ASC, a.regDate));
            }
            return orders;
        }
        if ("id_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  a.attachId));
        } else if ("id_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.attachId));
        } else if ("nm_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  a.fileNm));
        } else if ("nm_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.fileNm));
        } else if ("reg_asc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.ASC,  a.regDate));
        } else if ("reg_desc".equals(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
        } else {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
        }
        return orders;
    }

    @Override
    public int updateSelective(SyAttach entity) {
        if (entity.getAttachId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(a.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(a.attachGrpId,  entity.getAttachGrpId());  hasAny = true; }
        if (entity.getFileNm()       != null) { update.set(a.fileNm,       entity.getFileNm());       hasAny = true; }
        if (entity.getFileSize()     != null) { update.set(a.fileSize,     entity.getFileSize());     hasAny = true; }
        if (entity.getFileExt()      != null) { update.set(a.fileExt,      entity.getFileExt());      hasAny = true; }
        if (entity.getMimeTypeCd()   != null) { update.set(a.mimeTypeCd,   entity.getMimeTypeCd());   hasAny = true; }
        if (entity.getStoredNm()     != null) { update.set(a.storedNm,     entity.getStoredNm());     hasAny = true; }
        if (entity.getAttachUrl()    != null) { update.set(a.attachUrl,    entity.getAttachUrl());    hasAny = true; }
        if (entity.getPhysicalPath() != null) { update.set(a.physicalPath, entity.getPhysicalPath()); hasAny = true; }
        if (entity.getCdnHost()      != null) { update.set(a.cdnHost,      entity.getCdnHost());      hasAny = true; }
        if (entity.getCdnImgUrl()    != null) { update.set(a.cdnImgUrl,    entity.getCdnImgUrl());    hasAny = true; }
        if (entity.getCdnThumbUrl()  != null) { update.set(a.cdnThumbUrl,  entity.getCdnThumbUrl());  hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(a.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getAttachMemo()   != null) { update.set(a.attachMemo,   entity.getAttachMemo());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(a.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.attachId.eq(entity.getAttachId())).execute();
        return (int) affected;
    }
}
