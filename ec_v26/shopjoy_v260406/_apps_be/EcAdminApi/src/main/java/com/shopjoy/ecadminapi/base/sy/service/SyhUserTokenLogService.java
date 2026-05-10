package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserTokenLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhUserTokenLogService {

    private final SyhUserTokenLogMapper syhUserTokenLogMapper;
    private final SyhUserTokenLogRepository syhUserTokenLogRepository;

    /** getById — 단건조회 */
    public SyhUserTokenLogDto.Item getById(String id) {
        return syhUserTokenLogMapper.selectById(id);
    }

    /** getList — 목록조회 */
    public List<SyhUserTokenLogDto.Item> getList(SyhUserTokenLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syhUserTokenLogMapper.selectList(VoUtil.voToMap(req));
    }

    /** getPageData — 페이징조회 */
    public SyhUserTokenLogDto.PageResponse getPageData(SyhUserTokenLogDto.Request req) {
        PageHelper.addPaging(req);
        SyhUserTokenLogDto.PageResponse res = new SyhUserTokenLogDto.PageResponse();
        List<SyhUserTokenLogDto.Item> list = syhUserTokenLogMapper.selectPageList(VoUtil.voToMap(req));
        long count = syhUserTokenLogMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserTokenLog entity) {
        return syhUserTokenLogMapper.updateSelective(entity);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserTokenLogRepository.deleteAllBulk();
    }
}
