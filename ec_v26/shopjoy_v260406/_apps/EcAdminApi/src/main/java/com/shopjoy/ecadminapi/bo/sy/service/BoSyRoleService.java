package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyRoleService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyRoleMapper        mapper;
    private final SyRoleRepository    repository;
    private final SyRoleRedisStore    roleCache;
    private final SyRoleMenuRedisStore roleMenuCache;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyRoleDto getById(String id) {
        SyRoleDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyRole create(SyRole body) {
        body.setRoleId("RL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRole saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        roleCache.evictAll();
        return saved;
    }

    @Transactional
    public SyRoleDto update(String id, SyRole body) {
        SyRole entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "roleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRole saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        roleCache.evictAll();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyRole entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
        roleCache.evictAll();
        roleMenuCache.evict(id);
    }

    @Transactional
    public void saveList(List<SyRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyRole row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setRoleId("RL" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                SyRole entity = repository.findById(row.getRoleId())
                    .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getRoleId()));
                VoUtil.voCopyExclude(row, entity, "roleId^regBy^regDate");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                if (repository.existsById(row.getRoleId())) {
                    repository.deleteById(row.getRoleId());
                    roleMenuCache.evict(row.getRoleId());
                }
            }
        }
        em.flush();
        roleCache.evictAll();
    }
}
