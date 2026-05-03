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

    private final SyhUserTokenLogMapper mapper;
    private final SyhUserTokenLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhUserTokenLogDto getById(String id) {
        // syh_user_token_log :: select one :: id [orm:mybatis]
        SyhUserTokenLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhUserTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_user_token_log :: select list :: p [orm:mybatis]
        List<SyhUserTokenLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_user_token_log :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhUserTokenLog entity) {
        // syh_user_token_log :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    @Transactional
    public void deleteAll() {
        repository.deleteAll();
    }

}
