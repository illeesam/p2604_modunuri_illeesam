package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.PdProdHistQueryRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdProdHistService {

    private final PdProdHistQueryRepository pdProdHistQueryRepository;

    /** getOrders — 조회 (비페이징, 전체) */
    public List<PdProdHistDto.Item> getOrders(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        return pdProdHistQueryRepository.selectOrders(req);
    }

    /** getStockHist — 재고 이력 페이징 조회 (스크롤 조회) */
    public PageResult<PdProdHistDto.Item> getStockHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        PageHelper.addPaging(req);
        List<PdProdHistDto.Item> list = pdProdHistQueryRepository.selectStockHist(req);
        long total = pdProdHistQueryRepository.countStockHist(req);
        return PageResult.of(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** getPriceHist — 가격변경이력 페이징 조회 (스크롤 조회) */
    public PageResult<PdProdHistDto.Item> getPriceHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        PageHelper.addPaging(req);
        List<PdProdHistDto.Item> list = pdProdHistQueryRepository.selectPriceHist(req);
        long total = pdProdHistQueryRepository.countPriceHist(req);
        return PageResult.of(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** getStatusHist — 상품상태 이력 페이징 조회 (스크롤 조회) */
    public PageResult<PdProdHistDto.Item> getStatusHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        PageHelper.addPaging(req);
        List<PdProdHistDto.Item> list = pdProdHistQueryRepository.selectStatusHist(req);
        long total = pdProdHistQueryRepository.countStatusHist(req);
        return PageResult.of(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** getChangeHist — 상품정보 변경이력 페이징 조회 (스크롤 조회) */
    public PageResult<PdProdHistDto.Item> getChangeHist(String prodId, PdProdHistDto.Request req) {
        if (req == null) req = new PdProdHistDto.Request();
        req.setProdId(prodId);
        PageHelper.addPaging(req);
        List<PdProdHistDto.Item> list = pdProdHistQueryRepository.selectChangeHist(req);
        long total = pdProdHistQueryRepository.countChangeHist(req);
        return PageResult.of(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }
}
