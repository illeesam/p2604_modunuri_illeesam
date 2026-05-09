package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserLoginLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhUserLoginLogService {

    private final SyhUserLoginLogMapper syhUserLoginLogMapper;
    private final SyhUserLoginLogRepository syhUserLoginLogRepository;

    /** getById — 단건조회 */
    public SyhUserLoginLogDto.Item getById(String id) {
        return syhUserLoginLogMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhUserLoginLogDto.Item> getList(SyhUserLoginLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhUserLoginLogMapper.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhUserLoginLogDto.PageResponse getPageData(SyhUserLoginLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhUserLoginLogDto.PageResponse res = new SyhUserLoginLogDto.PageResponse();
        List<SyhUserLoginLogDto.Item> list = syhUserLoginLogMapper.selectPageList(req);
        long count = syhUserLoginLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserLoginLog entity) {
        return syhUserLoginLogMapper.updateSelective(entity);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserLoginLogRepository.deleteAllBulk();
    }
}
