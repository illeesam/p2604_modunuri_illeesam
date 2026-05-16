package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuChgHistRepository;
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
 * SKU 변경 이력 — write-once 로그성 엔티티 (updBy/updDate 없음).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdhProdSkuChgHistService {

    private final PdhProdSkuChgHistRepository pdhProdSkuChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 SKU 변경 이력 키조회 */
    public PdhProdSkuChgHistDto.Item getById(String id) {
        PdhProdSkuChgHistDto.Item dto = pdhProdSkuChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdSkuChgHistDto.Item getByIdOrNull(String id) {
        return pdhProdSkuChgHistRepository.selectById(id).orElse(null);
    }

    /* 상품 SKU 변경 이력 상세조회 */
    public PdhProdSkuChgHist findById(String id) {
        return pdhProdSkuChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdSkuChgHist findByIdOrNull(String id) {
        return pdhProdSkuChgHistRepository.findById(id).orElse(null);
    }

    /* 상품 SKU 변경 이력 목록조회 */
    public List<PdhProdSkuChgHistDto.Item> getList(PdhProdSkuChgHistDto.Request req) {
        return pdhProdSkuChgHistRepository.selectList(req);
    }

    /* 상품 SKU 변경 이력 페이지조회 */
    public PdhProdSkuChgHistDto.PageResponse getPageData(PdhProdSkuChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdSkuChgHistRepository.selectPageList(req);
    }

    /* 상품 SKU 변경 이력 등록 */
    @Transactional
    public PdhProdSkuChgHist create(PdhProdSkuChgHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        PdhProdSkuChgHist saved = pdhProdSkuChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }
}
