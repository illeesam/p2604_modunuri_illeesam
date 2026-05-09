package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhBatchLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhBatchLogService {

    private final SyhBatchLogMapper syhBatchLogMapper;
    private final SyhBatchLogRepository syhBatchLogRepository;

    /** getById — 단건조회 */
    public SyhBatchLogDto.Item getById(String id) {
        return syhBatchLogMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhBatchLogDto.Item> getList(SyhBatchLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhBatchLogMapper.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhBatchLogDto.PageResponse getPageData(SyhBatchLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhBatchLogDto.PageResponse res = new SyhBatchLogDto.PageResponse();
        List<SyhBatchLogDto.Item> list = syhBatchLogMapper.selectPageList(req);
        long count = syhBatchLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchLog entity) {
        return syhBatchLogMapper.updateSelective(entity);
    }
}
