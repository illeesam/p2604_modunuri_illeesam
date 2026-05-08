package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
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
@Transactional(readOnly = true)
public class MbhMemberLoginLogService {

    private final MbhMemberLoginLogMapper mbhMemberLoginLogMapper;
    private final MbhMemberLoginLogRepository mbhMemberLoginLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public MbhMemberLoginLogDto getById(String id) {
        MbhMemberLoginLogDto result = mbhMemberLoginLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<MbhMemberLoginLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbhMemberLoginLogDto> result = mbhMemberLoginLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<MbhMemberLoginLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbhMemberLoginLogMapper.selectPageList(p), mbhMemberLoginLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(MbhMemberLoginLog entity) {
        int result = mbhMemberLoginLogMapper.updateSelective(entity);
        return result;
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        mbhMemberLoginLogRepository.deleteAllBulk();
    }

}
