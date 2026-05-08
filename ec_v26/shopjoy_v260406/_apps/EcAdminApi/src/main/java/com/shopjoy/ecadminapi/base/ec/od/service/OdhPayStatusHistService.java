package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhPayStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayStatusHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OdhPayStatusHistService {

    private final OdhPayStatusHistMapper odhPayStatusHistMapper;
    private final OdhPayStatusHistRepository odhPayStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdhPayStatusHistDto getById(String id) {
        OdhPayStatusHistDto result = odhPayStatusHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdhPayStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhPayStatusHistDto> result = odhPayStatusHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdhPayStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhPayStatusHistMapper.selectPageList(p), odhPayStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdhPayStatusHist entity) {
        int result = odhPayStatusHistMapper.updateSelective(entity);
        return result;
    }

}
