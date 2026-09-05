package com.shopjoy.ecBeBo.bo.ec.st.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StDlivFeePolicyDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StDlivFeePolicy;
import com.shopjoy.ecBeBo.base.ec.st.service.StDlivFeePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO StDlivFeePolicy 서비스 — base StDlivFeePolicyService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStDlivFeePolicyService {

    private final StDlivFeePolicyService stDlivFeePolicyService;

    public StDlivFeePolicyDto.Item getById(String id) { return stDlivFeePolicyService.getById(id); }
    public List<StDlivFeePolicyDto.Item> getList(StDlivFeePolicyDto.Request req) { return stDlivFeePolicyService.getList(req); }
    public BasePage<StDlivFeePolicyDto.Item> getPageData(StDlivFeePolicyDto.Request req) { return stDlivFeePolicyService.getPageData(req); }

    @Transactional public StDlivFeePolicy create(StDlivFeePolicy body) { return stDlivFeePolicyService.create(body); }
    @Transactional public StDlivFeePolicy update(String id, StDlivFeePolicy body) { return stDlivFeePolicyService.update(id, body); }
    @Transactional public void delete(String id) { stDlivFeePolicyService.delete(id); }
    @Transactional public void saveListBase(List<StDlivFeePolicy> rows) { stDlivFeePolicyService.saveListBase(rows); }
}
