package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.mapper.SyCodeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyCodeRedisStore;
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
public class BoSyCodeService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyCodeMapper      mapper;
    private final SyCodeRepository  repository;
    private final SyCodeRedisStore  codeCache;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyCodeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyCodeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyCodeDto getById(String id) {
        SyCodeDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyCode create(SyCode body) {
        body.setCodeId("CD" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCode saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        codeCache.evictAll();
        return saved;
    }

    @Transactional
    public SyCodeDto update(String id, SyCode body) {
        SyCode entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopy(body, entity, "codeId", "regBy", "regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        codeCache.evictAll();
        return getById(id);
    }

    @Transactional
    public void saveList(List<SyCode> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyCode row : rows) {
            String status = row.getRowStatus();
            if ("I".equals(status)) {
                row.setCodeId("CD" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(status)) {
                String codeId = row.getCodeId();
                if (codeId == null) throw new CmBizException("수정 행에 codeId가 없습니다.");
                SyCode entity = repository.findById(codeId)
                    .orElseThrow(() -> new CmBizException("존재하지 않는 코드: " + codeId));
                VoUtil.voCopy(row, entity, "codeId", "regBy", "regDate");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(status)) {
                String codeId = row.getCodeId();
                if (codeId != null) repository.findById(codeId).ifPresent(repository::delete);
            }
        }
        em.flush();
        codeCache.evictAll();
    }

    @Transactional
    public void delete(String id) {
        SyCode entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
        codeCache.evictAll();
    }
}
