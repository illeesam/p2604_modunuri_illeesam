package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivStatusHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhDlivStatusHistService {

    private final OdhDlivStatusHistMapper odhDlivStatusHistMapper;
    private final OdhDlivStatusHistRepository odhDlivStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhDlivStatusHistDto getById(String id) {
        OdhDlivStatusHistDto result = odhDlivStatusHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdhDlivStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhDlivStatusHistDto> result = odhDlivStatusHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdhDlivStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhDlivStatusHistMapper.selectPageList(p), odhDlivStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdhDlivStatusHist entity) {
        int result = odhDlivStatusHistMapper.updateSelective(entity);
        return result;
    }

}
