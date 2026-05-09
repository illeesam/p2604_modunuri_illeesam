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
@Transactional(readOnly = true)
public class BoPdProdHistService {

    private final PdProdHistMapper pdProdHistMapper;

    /** getOrders — 조회 */
    public List<PdProdHistDto.Item> getOrders(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectOrders(prodId, p != null ? p : new HashMap<>());
    }

    /** getStockHist — 조회 */
    public List<PdProdHistDto.Item> getStockHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectStockHist(prodId, p != null ? p : new HashMap<>());
    }

    /** getPriceHist — 조회 */
    public List<PdProdHistDto.Item> getPriceHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectPriceHist(prodId, p != null ? p : new HashMap<>());
    }

    /** getStatusHist — 조회 */
    public List<PdProdHistDto.Item> getStatusHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectStatusHist(prodId, p != null ? p : new HashMap<>());
    }

    /** getChangeHist — 조회 */
    public List<PdProdHistDto.Item> getChangeHist(String prodId, Map<String, Object> p) {
        return pdProdHistMapper.selectChangeHist(prodId, p != null ? p : new HashMap<>());
    }
}
