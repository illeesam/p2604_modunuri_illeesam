package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyPropMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
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

@Service
@RequiredArgsConstructor
public class SyPropService {

    private final SyPropMapper syPropMapper;
    private final SyPropRepository syPropRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyPropDto getById(String id) {
        return syPropMapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<SyPropDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syPropMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyPropDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syPropMapper.selectPageList(p), syPropMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyProp entity) {
        return syPropMapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyProp create(SyProp entity) {
        entity.setPropId(CmUtil.generateId("sy_prop"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return syPropRepository.save(entity);
    }

    @Transactional
    public SyProp save(SyProp entity) {
        if (!syPropRepository.existsById(entity.getPropId()))
            throw new CmBizException("존재하지 않는 SyProp입니다: " + entity.getPropId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return syPropRepository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        SyProp entity = syPropRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syPropRepository.delete(entity);
        em.flush();
        if (syPropRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyProp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyProp row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPropId(CmUtil.generateId("sy_prop"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syPropRepository.save(row);
            } else if ("U".equals(rs)) {
                SyProp entity = syPropRepository.findById(row.getPropId())
                    .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getPropId()));
                entity.setSiteId(row.getSiteId());
                entity.setPathId(row.getPathId());
                entity.setPropKey(row.getPropKey());
                entity.setPropValue(row.getPropValue());
                entity.setPropLabel(row.getPropLabel());
                entity.setPropTypeCd(row.getPropTypeCd());
                entity.setSortOrd(row.getSortOrd());
                entity.setUseYn(row.getUseYn());
                entity.setPropRemark(row.getPropRemark());
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syPropRepository.save(entity);
            } else if ("D".equals(rs)) {
                if (syPropRepository.existsById(row.getPropId())) syPropRepository.deleteById(row.getPropId());
            }
        }
        em.flush();
    }

}
