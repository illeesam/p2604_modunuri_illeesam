package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberLoginLogMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoMbMemberLoginLogService {

    private final MbhMemberLoginLogMapper mbhMemberLoginLogMapper;
    private final MbhMemberLoginLogRepository mbhMemberLoginLogRepository;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<MbhMemberLoginLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mbhMemberLoginLogMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<MbhMemberLoginLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbhMemberLoginLogMapper.selectPageList(p), mbhMemberLoginLogMapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public MbhMemberLoginLogDto getById(String id) {
        return mbhMemberLoginLogMapper.selectById(id);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        mbhMemberLoginLogRepository.deleteAllBulk();
    }
}
