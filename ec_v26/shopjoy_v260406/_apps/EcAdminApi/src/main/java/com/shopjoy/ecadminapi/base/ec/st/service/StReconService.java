package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StReconMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StReconRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class StReconService {


    private final StReconMapper stReconMapper;
    private final StReconRepository stReconRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StReconDto getById(String id) {
        StReconDto result = stReconMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StReconDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StReconDto> result = stReconMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StReconDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stReconMapper.selectPageList(p), stReconMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StRecon entity) {
        int result = stReconMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StRecon create(StRecon entity) {
        entity.setReconId(CmUtil.generateId("st_recon"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StRecon result = stReconRepository.save(entity);
        return result;
    }

    @Transactional
    public StRecon save(StRecon entity) {
        if (!stReconRepository.existsById(entity.getReconId()))
            throw new CmBizException("존재하지 않는 StRecon입니다: " + entity.getReconId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StRecon result = stReconRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StRecon entity = stReconRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stReconRepository.delete(entity);
        em.flush();
        if (stReconRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StRecon> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StRecon row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setReconId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_recon"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stReconRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getReconId(), "reconId must not be null");
                StRecon entity = stReconRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "reconId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stReconRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getReconId(), "reconId must not be null");
                if (stReconRepository.existsById(id)) stReconRepository.deleteById(id);
            }
        }
        em.flush();
    }
}