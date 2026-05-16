package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
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

    private final PdhProdSkuStockHistRepository pdhProdSkuStockHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 SKU 재고 이력 키조회 */
    public PdhProdSkuStockHistDto.Item getById(String id) {
        PdhProdSkuStockHistDto.Item dto = pdhProdSkuStockHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdSkuStockHistDto.Item getByIdOrNull(String id) {
        return pdhProdSkuStockHistRepository.selectById(id).orElse(null);
    }

    /* 상품 SKU 재고 이력 상세조회 */
    public PdhProdSkuStockHist findById(String id) {
        return pdhProdSkuStockHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdSkuStockHist findByIdOrNull(String id) {
        return pdhProdSkuStockHistRepository.findById(id).orElse(null);
    }

    /* 상품 SKU 재고 이력 목록조회 */
    public List<PdhProdSkuStockHistDto.Item> getList(PdhProdSkuStockHistDto.Request req) {
        return pdhProdSkuStockHistRepository.selectList(req);
    }

    /* 상품 SKU 재고 이력 페이지조회 */
    public PdhProdSkuStockHistDto.PageResponse getPageData(PdhProdSkuStockHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdSkuStockHistRepository.selectPageList(req);
    }

    /* 상품 SKU 재고 이력 등록 */
    @Transactional
    public PdhProdSkuStockHist create(PdhProdSkuStockHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_stock_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        PdhProdSkuStockHist saved = pdhProdSkuStockHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }
}
