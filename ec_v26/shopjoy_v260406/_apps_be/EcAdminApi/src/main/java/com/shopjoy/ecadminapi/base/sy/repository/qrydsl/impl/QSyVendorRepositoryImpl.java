package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyVendor QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorRepositoryImpl implements QSyVendorRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyVendor v = QSyVendor.syVendor;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdVc = new QSyCode("cd_vc");
    private static final QSyCode cdVs = new QSyCode("cd_vs");

    /* 업체(판매자) buildBaseQuery */
    private JPAQuery<SyVendorDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorDto.Item.class,
                        v.vendorId, v.siteId, v.vendorNo, v.corpNo,
                        v.vendorNm, v.vendorNmEn, v.ceoNm, v.vendorType, v.vendorItem,
                        v.vendorClassCd, v.vendorZipCode, v.vendorAddr, v.vendorAddrDetail,
                        v.vendorPhone, v.vendorFax, v.vendorEmail, v.vendorHomepage,
                        v.vendorBankNm, v.vendorBankAccount, v.vendorBankHolder, v.vendorRegUrl,
                        v.openDate, v.contractDate, v.vendorStatusCd, v.pathId, v.vendorRemark,
                        v.regBy, v.regDate, v.updBy, v.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId))
                .leftJoin(cdVc).on(cdVc.codeGrp.eq("VENDOR_CLASS").and(cdVc.codeValue.eq(v.vendorClassCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VENDOR_STATUS").and(cdVs.codeValue.eq(v.vendorStatusCd)));
    }

    /* 업체(판매자) 키조회 */
    @Override
    public Optional<SyVendorDto.Item> selectById(String vendorId) {
        SyVendorDto.Item dto = buildBaseQuery()
                .where(v.vendorId.eq(vendorId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체(판매자) 목록조회 */
    @Override
    public List<SyVendorDto.Item> selectList(SyVendorDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 업체(판매자) 페이지조회 */
    @Override
    public SyVendorDto.PageResponse selectPageList(SyVendorDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(v.count()).from(v).where(where).fetchOne();

        SyVendorDto.PageResponse res = new SyVendorDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanBuilder buildCondition(SyVendorDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(v.siteId.eq(s.getSiteId()));
        // pathId 는 sy_path 재귀 조회가 필요한 조건이므로 단순 비교만 적용
        if (StringUtils.hasText(s.getPathId()))        w.and(v.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getVendorId()))      w.and(v.vendorId.eq(s.getVendorId()));
        if (StringUtils.hasText(s.getStatus()))        w.and(v.vendorStatusCd.eq(s.getStatus()));
        if (StringUtils.hasText(s.getVendorClassCd())) w.and(v.vendorClassCd.eq(s.getVendorClassCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",vendorNm,"))  or.or(v.vendorNm.likeIgnoreCase(pattern));
            if (all || types.contains(",ceoNm,")) or.or(v.ceoNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(v.regDate.goe(start)).and(v.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(v.updDate.goe(start)).and(v.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(SyVendorDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorId".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.vendorId));
                } else if ("vendorNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.vendorNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, v.regDate));
                }
            }
        }
        return orders;
    }

    /* 업체(판매자) 수정 */
    @Override
    public int updateSelective(SyVendor entity) {
        if (entity.getVendorId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(v.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getVendorNo()          != null) { update.set(v.vendorNo,          entity.getVendorNo());          hasAny = true; }
        if (entity.getCorpNo()            != null) { update.set(v.corpNo,            entity.getCorpNo());            hasAny = true; }
        if (entity.getVendorNm()          != null) { update.set(v.vendorNm,          entity.getVendorNm());          hasAny = true; }
        if (entity.getVendorNmEn()        != null) { update.set(v.vendorNmEn,        entity.getVendorNmEn());        hasAny = true; }
        if (entity.getCeoNm()             != null) { update.set(v.ceoNm,             entity.getCeoNm());             hasAny = true; }
        if (entity.getVendorType()        != null) { update.set(v.vendorType,        entity.getVendorType());        hasAny = true; }
        if (entity.getVendorItem()        != null) { update.set(v.vendorItem,        entity.getVendorItem());        hasAny = true; }
        if (entity.getVendorClassCd()     != null) { update.set(v.vendorClassCd,     entity.getVendorClassCd());     hasAny = true; }
        if (entity.getVendorZipCode()     != null) { update.set(v.vendorZipCode,     entity.getVendorZipCode());     hasAny = true; }
        if (entity.getVendorAddr()        != null) { update.set(v.vendorAddr,        entity.getVendorAddr());        hasAny = true; }
        if (entity.getVendorAddrDetail()  != null) { update.set(v.vendorAddrDetail,  entity.getVendorAddrDetail());  hasAny = true; }
        if (entity.getVendorPhone()       != null) { update.set(v.vendorPhone,       entity.getVendorPhone());       hasAny = true; }
        if (entity.getVendorFax()         != null) { update.set(v.vendorFax,         entity.getVendorFax());         hasAny = true; }
        if (entity.getVendorEmail()       != null) { update.set(v.vendorEmail,       entity.getVendorEmail());       hasAny = true; }
        if (entity.getVendorHomepage()    != null) { update.set(v.vendorHomepage,    entity.getVendorHomepage());    hasAny = true; }
        if (entity.getVendorBankNm()      != null) { update.set(v.vendorBankNm,      entity.getVendorBankNm());      hasAny = true; }
        if (entity.getVendorBankAccount() != null) { update.set(v.vendorBankAccount, entity.getVendorBankAccount()); hasAny = true; }
        if (entity.getVendorBankHolder()  != null) { update.set(v.vendorBankHolder,  entity.getVendorBankHolder());  hasAny = true; }
        if (entity.getVendorRegUrl()      != null) { update.set(v.vendorRegUrl,      entity.getVendorRegUrl());      hasAny = true; }
        if (entity.getOpenDate()          != null) { update.set(v.openDate,          entity.getOpenDate());          hasAny = true; }
        if (entity.getContractDate()      != null) { update.set(v.contractDate,      entity.getContractDate());      hasAny = true; }
        if (entity.getVendorStatusCd()    != null) { update.set(v.vendorStatusCd,    entity.getVendorStatusCd());    hasAny = true; }
        if (entity.getPathId()            != null) { update.set(v.pathId,            entity.getPathId());            hasAny = true; }
        if (entity.getVendorRemark()      != null) { update.set(v.vendorRemark,      entity.getVendorRemark());      hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(v.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(v.updDate,           entity.getUpdDate());           hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(v.vendorId.eq(entity.getVendorId())).execute();
        return (int) affected;
    }
}
