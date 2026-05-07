package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserTokenLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhUserTokenLogService {

    private final SyhUserTokenLogMapper syhUserTokenLogMapper;
    private final SyhUserTokenLogRepository syhUserTokenLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhUserTokenLogDto getById(String id) {
        // syh_user_token_log :: select one :: id [orm:mybatis]
        SyhUserTokenLogDto result = syhUserTokenLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyhUserTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_user_token_log :: select list :: p [orm:mybatis]
        List<SyhUserTokenLogDto> result = syhUserTokenLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyhUserTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_user_token_log :: select page :: [orm:mybatis]
        return PageResult.of(syhUserTokenLogMapper.selectPageList(p), syhUserTokenLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserTokenLog entity) {
        // syh_user_token_log :: update :: [orm:mybatis]
        int result = syhUserTokenLogMapper.updateSelective(entity);
        return result;
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserTokenLogRepository.deleteAllBulk();
    }

}
