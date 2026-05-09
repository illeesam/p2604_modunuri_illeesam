package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhAccessLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAccessLogService {

    private final SyhAccessLogMapper syhAccessLogMapper;
    private final SyhAccessLogRepository syhAccessLogRepository;

    /** getPageData — 페이징조회 */
    public SyhAccessLogDto.PageResponse getPageData(SyhAccessLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhAccessLogDto.PageResponse res = new SyhAccessLogDto.PageResponse();
        List<SyhAccessLogDto.Item> list = syhAccessLogMapper.selectPageList(req);
        long count = syhAccessLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessLogRepository.deleteAllBulk();
    }
}
