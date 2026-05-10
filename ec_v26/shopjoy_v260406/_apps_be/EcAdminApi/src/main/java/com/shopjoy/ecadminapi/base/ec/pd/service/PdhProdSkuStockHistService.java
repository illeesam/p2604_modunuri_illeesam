package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuStockHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuStockHistRepository;
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
 * SKU 재고 이력 — write-once 로그성 엔티티 (updBy/updDate 없음).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdhProdSkuStockHistService {

    private final PdhProdSkuStockHistMapper pdhProdSkuStockHistMapper;
    private final PdhProdSkuStockHistRepository pdhProdSkuStockHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuStockHistDto.Item getById(String id) {
        PdhProdSkuStockHistDto.Item dto = pdhProdSkuStockHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdSkuStockHist findById(String id) {
        return pdhProdSkuStockHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public List<PdhProdSkuStockHistDto.Item> getList(PdhProdSkuStockHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdSkuStockHistMapper.selectList(VoUtil.voToMap(req));
    }

    public PdhProdSkuStockHistDto.PageResponse getPageData(PdhProdSkuStockHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdSkuStockHistDto.PageResponse res = new PdhProdSkuStockHistDto.PageResponse();
        List<PdhProdSkuStockHistDto.Item> list = pdhProdSkuStockHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdhProdSkuStockHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdSkuStockHist create(PdhProdSkuStockHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_stock_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        PdhProdSkuStockHist saved = pdhProdSkuStockHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }
}
