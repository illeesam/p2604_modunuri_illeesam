package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdHistMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdProdHistService {

    private final PdProdHistMapper pdProdHistMapper;

    /** getOrders — 조회 */
    public List<PdProdHistDto.Item> getOrders(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        return pdProdHistMapper.selectOrders(req);
    }

    /** getStockHist — 조회 */
    public List<PdProdHistDto.Item> getStockHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        return pdProdHistMapper.selectStockHist(req);
    }

    /** getPriceHist — 조회 */
    public List<PdProdHistDto.Item> getPriceHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        return pdProdHistMapper.selectPriceHist(req);
    }

    /** getStatusHist — 조회 */
    public List<PdProdHistDto.Item> getStatusHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        return pdProdHistMapper.selectStatusHist(req);
    }

    /** getChangeHist — 조회 */
    public List<PdProdHistDto.Item> getChangeHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        return pdProdHistMapper.selectChangeHist(req);
    }
}
