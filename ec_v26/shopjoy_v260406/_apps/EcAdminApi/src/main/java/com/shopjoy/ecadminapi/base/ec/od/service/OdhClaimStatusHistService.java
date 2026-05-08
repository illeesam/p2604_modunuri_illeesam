package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimStatusHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OdhClaimStatusHistService {

    private final OdhClaimStatusHistMapper odhClaimStatusHistMapper;
    private final OdhClaimStatusHistRepository odhClaimStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdhClaimStatusHistDto getById(String id) {
        OdhClaimStatusHistDto result = odhClaimStatusHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdhClaimStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhClaimStatusHistDto> result = odhClaimStatusHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdhClaimStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhClaimStatusHistMapper.selectPageList(p), odhClaimStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdhClaimStatusHist entity) {
        int result = odhClaimStatusHistMapper.updateSelective(entity);
        return result;
    }

}
