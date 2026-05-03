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
public class SyhUserLoginLogService {

    private final SyhUserLoginLogMapper mapper;
    private final SyhUserLoginLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhUserLoginLogDto getById(String id) {
        // syh_user_login_log :: select one :: id [orm:mybatis]
        SyhUserLoginLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhUserLoginLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_user_login_log :: select list :: p [orm:mybatis]
        List<SyhUserLoginLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserLoginLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_user_login_log :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhUserLoginLog entity) {
        // syh_user_login_log :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    @Transactional
    public void deleteAll() {
        repository.deleteAllBulk();
    }

}
