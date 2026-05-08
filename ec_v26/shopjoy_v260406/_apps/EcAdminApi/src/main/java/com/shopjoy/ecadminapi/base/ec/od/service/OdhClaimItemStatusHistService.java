package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimItemStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemStatusHistRepository;
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
public class OdhClaimItemStatusHistService {

    private final OdhClaimItemStatusHistMapper odhClaimItemStatusHistMapper;
    private final OdhClaimItemStatusHistRepository odhClaimItemStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdhClaimItemStatusHistDto getById(String id) {
        OdhClaimItemStatusHistDto result = odhClaimItemStatusHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdhClaimItemStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhClaimItemStatusHistDto> result = odhClaimItemStatusHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdhClaimItemStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhClaimItemStatusHistMapper.selectPageList(p), odhClaimItemStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdhClaimItemStatusHist entity) {
        int result = odhClaimItemStatusHistMapper.updateSelective(entity);
        return result;
    }

}
