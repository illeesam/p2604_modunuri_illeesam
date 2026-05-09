package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendMsgLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhSendMsgLogService {

    private final SyhSendMsgLogMapper syhSendMsgLogMapper;
    private final SyhSendMsgLogRepository syhSendMsgLogRepository;

    /** getById — 단건조회 */
    public SyhSendMsgLogDto.Item getById(String id) {
        return syhSendMsgLogMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhSendMsgLogDto.Item> getList(SyhSendMsgLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhSendMsgLogMapper.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhSendMsgLogDto.PageResponse getPageData(SyhSendMsgLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhSendMsgLogDto.PageResponse res = new SyhSendMsgLogDto.PageResponse();
        List<SyhSendMsgLogDto.Item> list = syhSendMsgLogMapper.selectPageList(req);
        long count = syhSendMsgLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendMsgLog entity) {
        return syhSendMsgLogMapper.updateSelective(entity);
    }
}
