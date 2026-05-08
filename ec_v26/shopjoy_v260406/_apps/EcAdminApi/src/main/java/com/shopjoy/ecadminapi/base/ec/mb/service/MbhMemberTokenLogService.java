package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberTokenLogMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberTokenLogRepository;
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
public class MbhMemberTokenLogService {

    private final MbhMemberTokenLogMapper mbhMemberTokenLogMapper;
    private final MbhMemberTokenLogRepository mbhMemberTokenLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public MbhMemberTokenLogDto getById(String id) {
        MbhMemberTokenLogDto result = mbhMemberTokenLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<MbhMemberTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbhMemberTokenLogDto> result = mbhMemberTokenLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<MbhMemberTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbhMemberTokenLogMapper.selectPageList(p), mbhMemberTokenLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(MbhMemberTokenLog entity) {
        int result = mbhMemberTokenLogMapper.updateSelective(entity);
        return result;
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        mbhMemberTokenLogRepository.deleteAllBulk();
    }

}
