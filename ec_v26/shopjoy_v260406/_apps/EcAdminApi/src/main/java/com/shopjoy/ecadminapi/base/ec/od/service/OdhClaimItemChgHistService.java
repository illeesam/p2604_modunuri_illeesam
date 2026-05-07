package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimItemChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemChgHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhClaimItemChgHistService {

    private final OdhClaimItemChgHistMapper odhClaimItemChgHistMapper;
    private final OdhClaimItemChgHistRepository odhClaimItemChgHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhClaimItemChgHistDto getById(String id) {
        OdhClaimItemChgHistDto result = odhClaimItemChgHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdhClaimItemChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhClaimItemChgHistDto> result = odhClaimItemChgHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdhClaimItemChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhClaimItemChgHistMapper.selectPageList(p), odhClaimItemChgHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdhClaimItemChgHist entity) {
        int result = odhClaimItemChgHistMapper.updateSelective(entity);
        return result;
    }

}
