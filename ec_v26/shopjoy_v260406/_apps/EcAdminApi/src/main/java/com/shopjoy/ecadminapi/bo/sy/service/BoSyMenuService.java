package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyMenuRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class BoSyMenuService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyMenuMapper      mapper;
    private final SyMenuRepository  repository;
    private final SyMenuRedisStore  menuCache;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyMenuDto getById(String id) {
        SyMenuDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyMenu create(SyMenu body) {
        body.setMenuId("MN" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyMenu saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        menuCache.evictAll();
        return saved;
    }

    @Transactional
    public SyMenuDto update(String id, SyMenu body) {
        SyMenu entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyMenu saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        menuCache.evictAll();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        repository.deleteById(id);
        em.flush();
        menuCache.evictAll();
    }
}
