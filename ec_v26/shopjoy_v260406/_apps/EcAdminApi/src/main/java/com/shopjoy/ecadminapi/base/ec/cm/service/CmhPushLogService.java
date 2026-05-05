package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmhPushLogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmhPushLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmhPushLogService {

    private final CmhPushLogMapper cmhPushLogMapper;
    private final CmhPushLogRepository cmhPushLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmhPushLogDto getById(String id) {
        // cmh_push_log :: select one :: id [orm:mybatis]
        CmhPushLogDto result = cmhPushLogMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmhPushLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cmh_push_log :: select list :: p [orm:mybatis]
        List<CmhPushLogDto> result = cmhPushLogMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmhPushLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cmh_push_log :: select page :: [orm:mybatis]
        return PageResult.of(cmhPushLogMapper.selectPageList(p), cmhPushLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmhPushLog entity) {
        // cmh_push_log :: update :: [orm:mybatis]
        int result = cmhPushLogMapper.updateSelective(entity);
        return result;
    }

}
