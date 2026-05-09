package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhAccessErrorLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessErrorLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAccessErrorLogService {

    private final SyhAccessErrorLogMapper syhAccessErrorLogMapper;
    private final SyhAccessErrorLogRepository syhAccessErrorLogRepository;

    /** getPageData — 페이징조회 */
    public SyhAccessErrorLogDto.PageResponse getPageData(SyhAccessErrorLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhAccessErrorLogDto.PageResponse res = new SyhAccessErrorLogDto.PageResponse();
        List<SyhAccessErrorLogDto.Item> list = syhAccessErrorLogMapper.selectPageList(req);
        long count = syhAccessErrorLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessErrorLogRepository.deleteAllBulk();
    }
}
