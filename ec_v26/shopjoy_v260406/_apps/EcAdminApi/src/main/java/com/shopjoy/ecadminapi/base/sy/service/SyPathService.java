package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.mapper.SyPathMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyPathService {

    private final SyPathMapper mapper;
    private final SyPathRepository repository;

    @Transactional(readOnly = true)
    public SyPathDto getById(Long id) {
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<SyPathDto> getList(Map<String, Object> p) {
        castLongParam(p, "parentPathId");
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyPathDto> getPageData(Map<String, Object> p) {
        castLongParam(p, "parentPathId");
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
                PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    private void castLongParam(Map<String, Object> p, String key) {
        Object val = p.get(key);
        if (val instanceof String s && !s.isBlank()) {
            try { p.put(key, Long.parseLong(s)); } catch (NumberFormatException ignore) { p.remove(key); }
        }
    }

    @Transactional
    public SyPath create(SyPath entity) {
        entity.setPathId(null); // BIGSERIAL — DB가 자동 생성
        entity.setRegBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public SyPath save(Long id, SyPath entity) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyPath입니다: " + id);
        entity.setPathId(id);
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public int update(Long id, SyPath entity) {
        entity.setPathId(id);
        return mapper.updateSelective(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyPath입니다: " + id);
        repository.deleteById(id);
    }
}
