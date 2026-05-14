package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
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

    private final PdhProdSkuPriceHistRepository pdhProdSkuPriceHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuPriceHistDto.Item getById(String id) {
        PdhProdSkuPriceHistDto.Item dto = pdhProdSkuPriceHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdSkuPriceHistDto.Item getByIdOrNull(String id) {
        return pdhProdSkuPriceHistRepository.selectById(id).orElse(null);
    }

    public PdhProdSkuPriceHist findById(String id) {
        return pdhProdSkuPriceHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdSkuPriceHist findByIdOrNull(String id) {
        return pdhProdSkuPriceHistRepository.findById(id).orElse(null);
    }

    public List<PdhProdSkuPriceHistDto.Item> getList(PdhProdSkuPriceHistDto.Request req) {
        return pdhProdSkuPriceHistRepository.selectList(req);
    }

    public PdhProdSkuPriceHistDto.PageResponse getPageData(PdhProdSkuPriceHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdSkuPriceHistRepository.selectPageList(req);
    }

    @Transactional
    public PdhProdSkuPriceHist create(PdhProdSkuPriceHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_price_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        PdhProdSkuPriceHist saved = pdhProdSkuPriceHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }
}
