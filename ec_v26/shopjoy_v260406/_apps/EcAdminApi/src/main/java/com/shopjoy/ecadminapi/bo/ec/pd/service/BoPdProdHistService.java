package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdHistMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoPdProdHistService {

    private final PdProdHistMapper pdProdHistMapper;

    @Transactional(readOnly = true)
    public List<PdProdHistDto> getOrders(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectOrders(prodId, p != null ? p : new HashMap<>());
    }

    @Transactional(readOnly = true)
    public List<PdProdHistDto> getStockHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectStockHist(prodId, p != null ? p : new HashMap<>());
    }

    @Transactional(readOnly = true)
    public List<PdProdHistDto> getPriceHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectPriceHist(prodId, p != null ? p : new HashMap<>());
    }

    @Transactional(readOnly = true)
    public List<PdProdHistDto> getStatusHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectStatusHist(prodId, p != null ? p : new HashMap<>());
    }

    @Transactional(readOnly = true)
    public List<PdProdHistDto> getChangeHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectChangeHist(prodId, p != null ? p : new HashMap<>());
    }
}
