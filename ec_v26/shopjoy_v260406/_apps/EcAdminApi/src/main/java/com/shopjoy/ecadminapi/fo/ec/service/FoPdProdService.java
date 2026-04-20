package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdMapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 상품 서비스 — 사용자 화면용 상품 조회
 * URL: /api/fo/ec/pd/prod
 *
 * base 와 차이:
 *  - 판매중(ON_SALE) 상품만 노출
 *  - siteId 필수 필터링
 */
@Service
@RequiredArgsConstructor
public class FoPdProdService {

    private final PdProdMapper mapper;

    @Transactional(readOnly = true)
    public List<PdProdDto> getList(Map<String, Object> p) {
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        Map<String, Object> param = new HashMap<>(p);
        param.put("limit",  pageSize);
        param.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(param), mapper.selectPageCount(param), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public PdProdDto getById(String id) {
        PdProdDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 상품입니다: " + id);
        return dto;
    }
}
