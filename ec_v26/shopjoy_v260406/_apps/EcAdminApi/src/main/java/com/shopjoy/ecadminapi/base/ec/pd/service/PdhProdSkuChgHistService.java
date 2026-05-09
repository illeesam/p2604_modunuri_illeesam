package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuChgHistMapper;
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

    private final PdhProdSkuChgHistMapper pdhProdSkuChgHistMapper;
    private final PdhProdSkuChgHistRepository pdhProdSkuChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuChgHistDto.Item getById(String id) {
        PdhProdSkuChgHistDto.Item dto = pdhProdSkuChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdSkuChgHist findById(String id) {
        return pdhProdSkuChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public List<PdhProdSkuChgHistDto.Item> getList(PdhProdSkuChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdSkuChgHistMapper.selectList(req);
    }

    public PdhProdSkuChgHistDto.PageResponse getPageData(PdhProdSkuChgHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdSkuChgHistDto.PageResponse res = new PdhProdSkuChgHistDto.PageResponse();
        List<PdhProdSkuChgHistDto.Item> list = pdhProdSkuChgHistMapper.selectPageList(req);
        long count = pdhProdSkuChgHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdSkuChgHist create(PdhProdSkuChgHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        PdhProdSkuChgHist saved = pdhProdSkuChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }
}
