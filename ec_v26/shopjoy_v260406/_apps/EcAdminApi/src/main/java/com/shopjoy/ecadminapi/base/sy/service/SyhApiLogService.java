package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhApiLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhApiLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhApiLogService {

    private final SyhApiLogMapper syhApiLogMapper;
    private final SyhApiLogRepository syhApiLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    /** getById — 단건조회 */
    public SyhApiLogDto.Item getById(String id) {
        return syhApiLogMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhApiLogDto.Item> getList(SyhApiLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhApiLogMapper.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhApiLogDto.PageResponse getPageData(SyhApiLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhApiLogDto.PageResponse res = new SyhApiLogDto.PageResponse();
        List<SyhApiLogDto.Item> list = syhApiLogMapper.selectPageList(req);
        long count = syhApiLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhApiLog entity) {
        return syhApiLogMapper.updateSelective(entity);
    }

}
