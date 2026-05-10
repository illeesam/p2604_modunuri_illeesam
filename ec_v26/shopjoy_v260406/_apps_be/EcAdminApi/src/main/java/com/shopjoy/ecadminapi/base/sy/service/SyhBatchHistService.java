package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhBatchHistMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhBatchHistService {

    private final SyhBatchHistMapper syhBatchHistMapper;
    private final SyhBatchHistRepository syhBatchHistRepository;

    /** getById — 단건조회 */
    public SyhBatchHistDto.Item getById(String id) {
        return syhBatchHistMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhBatchHistDto.Item> getList(SyhBatchHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhBatchHistMapper.selectList(VoUtil.voToMap(req));
    }

    /** getPageData — 페이징조회 */
    public SyhBatchHistDto.PageResponse getPageData(SyhBatchHistDto.Request req) {
        PageHelper.addPaging(req);
        SyhBatchHistDto.PageResponse res = new SyhBatchHistDto.PageResponse();
        List<SyhBatchHistDto.Item> list = syhBatchHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = syhBatchHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchHist entity) {
        return syhBatchHistMapper.updateSelective(entity);
    }
}
