package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuPriceHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuPriceHistRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SKU 가격 이력 — write-once 로그성 엔티티 (updBy/updDate 없음).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdhProdSkuPriceHistService {

    private final PdhProdSkuPriceHistMapper pdhProdSkuPriceHistMapper;
    private final PdhProdSkuPriceHistRepository pdhProdSkuPriceHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuPriceHistDto.Item getById(String id) {
        PdhProdSkuPriceHistDto.Item dto = pdhProdSkuPriceHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdSkuPriceHist findById(String id) {
        return pdhProdSkuPriceHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public List<PdhProdSkuPriceHistDto.Item> getList(PdhProdSkuPriceHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdSkuPriceHistMapper.selectList(req);
    }

    public PdhProdSkuPriceHistDto.PageResponse getPageData(PdhProdSkuPriceHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdSkuPriceHistDto.PageResponse res = new PdhProdSkuPriceHistDto.PageResponse();
        List<PdhProdSkuPriceHistDto.Item> list = pdhProdSkuPriceHistMapper.selectPageList(req);
        long count = pdhProdSkuPriceHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdSkuPriceHist create(PdhProdSkuPriceHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_price_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        PdhProdSkuPriceHist saved = pdhProdSkuPriceHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }
}
