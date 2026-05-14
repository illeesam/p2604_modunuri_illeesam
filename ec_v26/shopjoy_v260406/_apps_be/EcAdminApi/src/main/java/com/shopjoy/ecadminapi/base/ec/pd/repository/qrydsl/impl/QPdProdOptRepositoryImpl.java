package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptRepository;
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

/** PdProdOpt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptRepositoryImpl implements QPdProdOptRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdOpt o    = QPdProdOpt.pdProdOpt;
    private static final QSySite    ste  = QSySite.sySite;
    private static final QSyCode    cdOt  = new QSyCode("cd_ot");
    private static final QSyCode    cdOit = new QSyCode("cd_oit");

    @Override
    public Optional<PdProdOptDto.Item> selectById(String optId) {
        PdProdOptDto.Item dto = baseQuery()
                .where(o.optId.eq(optId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdProdOptDto.Item> selectList(PdProdOptDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptDto.Item> query = baseQuery().where(where);
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

    @Override
    public PdProdOptDto.PageResponse selectPageList(PdProdOptDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdOptDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(o.count()).from(o).where(where).fetchOne();

        PdProdOptDto.PageResponse res = new PdProdOptDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdProdOptDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptDto.Item.class,
                        o.optId,
                        o.siteId,
                        o.prodId,
                        o.optGrpNm,
                        o.optLevel,
                        o.optTypeCd,
                        o.optInputTypeCd,
                        o.sortOrd,
                        o.regBy,
                        o.regDate,
                        o.updBy,
                        o.updDate,
                        ste.siteNm.as("siteNm"),
                        cdOt.codeLabel.as("optTypeCdNm"),
                        cdOit.codeLabel.as("optInputTypeCdNm")
                ))
                .from(o)
                .leftJoin(ste).on(ste.siteId.eq(o.siteId))
                .leftJoin(cdOt).on(cdOt.codeGrp.eq("OPT_TYPE").and(cdOt.codeValue.eq(o.optTypeCd)))
                .leftJoin(cdOit).on(cdOit.codeGrp.eq("OPT_INPUT_TYPE").and(cdOit.codeValue.eq(o.optInputTypeCd)));
    }

    private BooleanBuilder buildCondition(PdProdOptDto.Request req) {
        BooleanBuilder w = new BooleanBuilder();
        if (req == null) return w;

        if (StringUtils.hasText(req.getProdId())) w.and(o.prodId.eq(req.getProdId()));
        if (StringUtils.hasText(req.getSiteId())) w.and(o.siteId.eq(req.getSiteId()));
        if (StringUtils.hasText(req.getOptId()))  w.and(o.optId.eq(req.getOptId()));

        // typeCd 는 BaseRequest 에 없음, 화면에서 별도 호출 시 mapper 와 차이 있음 — DTO 에 미정의이므로 생략

        if (StringUtils.hasText(req.getSearchValue())) {
            String types = req.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + req.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_opt_grp_nm")) or.or(o.optGrpNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(req.getDateType())
                && StringUtils.hasText(req.getDateStart())
                && StringUtils.hasText(req.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(req.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(req.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (req.getDateType()) {
                case "reg_date":
                    w.and(o.regDate.goe(start)).and(o.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(o.updDate.goe(start)).and(o.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PdProdOptDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, o.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("optId".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.optId));
                } else if ("optGrpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.optGrpNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PdProdOpt entity) {
        if (entity.getOptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(o);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(o.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getProdId()         != null) { update.set(o.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getOptGrpNm()       != null) { update.set(o.optGrpNm,       entity.getOptGrpNm());       hasAny = true; }
        if (entity.getOptLevel()       != null) { update.set(o.optLevel,       entity.getOptLevel());       hasAny = true; }
        if (entity.getOptTypeCd()      != null) { update.set(o.optTypeCd,      entity.getOptTypeCd());      hasAny = true; }
        if (entity.getOptInputTypeCd() != null) { update.set(o.optInputTypeCd, entity.getOptInputTypeCd()); hasAny = true; }
        if (entity.getSortOrd()        != null) { update.set(o.sortOrd,        entity.getSortOrd());        hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(o.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(o.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(o.optId.eq(entity.getOptId())).execute();
        return (int) affected;
    }
}
