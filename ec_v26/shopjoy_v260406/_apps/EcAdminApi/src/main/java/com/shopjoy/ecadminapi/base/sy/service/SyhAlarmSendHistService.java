package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhAlarmSendHistMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAlarmSendHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAlarmSendHistService {

    private final SyhAlarmSendHistMapper syhAlarmSendHistMapper;
    private final SyhAlarmSendHistRepository syhAlarmSendHistRepository;

    /** getById — 단건조회 */
    public SyhAlarmSendHistDto.Item getById(String id) {
        return syhAlarmSendHistMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhAlarmSendHistDto.Item> getList(SyhAlarmSendHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhAlarmSendHistMapper.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhAlarmSendHistDto.PageResponse getPageData(SyhAlarmSendHistDto.Request req) {
        PageHelper.addPaging(req);
        SyhAlarmSendHistDto.PageResponse res = new SyhAlarmSendHistDto.PageResponse();
        List<SyhAlarmSendHistDto.Item> list = syhAlarmSendHistMapper.selectPageList(req);
        long count = syhAlarmSendHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhAlarmSendHist entity) {
        return syhAlarmSendHistMapper.updateSelective(entity);
    }
}
