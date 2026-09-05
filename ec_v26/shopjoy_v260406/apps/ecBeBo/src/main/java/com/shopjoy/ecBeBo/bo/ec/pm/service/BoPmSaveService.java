package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSavePolicyDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSavePolicy;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSavePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 적립금 정책(캠페인) 서비스 — base PmSavePolicyService 위임 (thin wrapper).
 * 회원별 적립/사용 원장(pm_save/PmSave)과는 별개 — 그쪽은 ZdSimulController 등에서 그대로 사용 중.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmSaveService {

    private final PmSavePolicyService pmSavePolicyService;

    /* 키조회 */
    public PmSavePolicyDto.Item getById(String id) { return pmSavePolicyService.getById(id); }
    /* 목록조회 */
    public List<PmSavePolicyDto.Item> getList(PmSavePolicyDto.Request req) { return pmSavePolicyService.getList(req); }
    /* 페이지조회 */
    public BasePage<PmSavePolicyDto.Item> getPageData(PmSavePolicyDto.Request req) { return pmSavePolicyService.getPageData(req); }

    @Transactional public PmSavePolicy create(PmSavePolicy body) { return pmSavePolicyService.create(body); }
    @Transactional public PmSavePolicy update(String id, PmSavePolicy body) { return pmSavePolicyService.update(id, body); }
    @Transactional public void delete(String id) { pmSavePolicyService.delete(id); }
    @Transactional public void saveListBase(List<PmSavePolicy> rows) { pmSavePolicyService.saveListBase(rows); }
}
