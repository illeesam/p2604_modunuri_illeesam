package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhOrderItemStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemStatusHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhOrderItemStatusHistService {

    private final OdhOrderItemStatusHistMapper odhOrderItemStatusHistMapper;
    private final OdhOrderItemStatusHistRepository odhOrderItemStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhOrderItemStatusHistDto getById(String id) {
        OdhOrderItemStatusHistDto result = odhOrderItemStatusHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdhOrderItemStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhOrderItemStatusHistDto> result = odhOrderItemStatusHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdhOrderItemStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhOrderItemStatusHistMapper.selectPageList(p), odhOrderItemStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdhOrderItemStatusHist entity) {
        int result = odhOrderItemStatusHistMapper.updateSelective(entity);
        return result;
    }

}
