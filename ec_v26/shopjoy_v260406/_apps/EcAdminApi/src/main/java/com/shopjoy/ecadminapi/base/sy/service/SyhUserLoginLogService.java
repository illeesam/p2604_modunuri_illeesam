package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserLoginLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginLogRepository;
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
public class SyhUserLoginLogService {

    private final SyhUserLoginLogMapper syhUserLoginLogMapper;
    private final SyhUserLoginLogRepository syhUserLoginLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyhUserLoginLogDto getById(String id) {
        // syh_user_login_log :: select one :: id [orm:mybatis]
        SyhUserLoginLogDto result = syhUserLoginLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyhUserLoginLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_user_login_log :: select list :: p [orm:mybatis]
        List<SyhUserLoginLogDto> result = syhUserLoginLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyhUserLoginLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_user_login_log :: select page :: [orm:mybatis]
        return PageResult.of(syhUserLoginLogMapper.selectPageList(p), syhUserLoginLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserLoginLog entity) {
        // syh_user_login_log :: update :: [orm:mybatis]
        int result = syhUserLoginLogMapper.updateSelective(entity);
        return result;
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserLoginLogRepository.deleteAllBulk();
    }

}
