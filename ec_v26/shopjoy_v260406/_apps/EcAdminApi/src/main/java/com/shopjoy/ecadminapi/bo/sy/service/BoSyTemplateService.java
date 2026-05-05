package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.mapper.SyTemplateMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
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
import java.util.Objects;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyTemplateService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyTemplateMapper syTemplateMapper;
    private final SyTemplateRepository syTemplateRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyTemplateDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syTemplateMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyTemplateDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syTemplateMapper.selectPageList(p), syTemplateMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyTemplateDto getById(String id) {
        SyTemplateDto dto = syTemplateMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyTemplate create(SyTemplate body) {
        body.setTemplateId("TM" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        return syTemplateRepository.save(body);
    }

    @Transactional
    public SyTemplateDto update(String id, SyTemplate body) {
        SyTemplate entity = syTemplateRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        syTemplateRepository.save(entity);
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyTemplate entity = syTemplateRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syTemplateRepository.delete(entity);
        em.flush();
        if (syTemplateRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    @Transactional
    public void saveList(List<SyTemplate> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getTemplateId() != null)
            .map(SyTemplate::getTemplateId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syTemplateRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyTemplate> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getTemplateId() != null)
            .toList();
        for (SyTemplate row : updateRows) {
            SyTemplate entity = syTemplateRepository.findById(row.getTemplateId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getTemplateId()));
            VoUtil.voCopyExclude(row, entity, "templateId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syTemplateRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyTemplate> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyTemplate row : insertRows) {
            row.setTemplateId("TM" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syTemplateRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}