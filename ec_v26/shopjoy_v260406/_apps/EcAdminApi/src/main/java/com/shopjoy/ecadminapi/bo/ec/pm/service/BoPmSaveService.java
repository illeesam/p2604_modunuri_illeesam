package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveRepository;
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
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoPmSaveService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PmSaveMapper pmSaveMapper;
    private final PmSaveRepository pmSaveRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<PmSaveDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pmSaveMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmSaveDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmSaveMapper.selectPageList(p), pmSaveMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public PmSaveDto getById(String id) {
        PmSaveDto dto = pmSaveMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PmSave create(PmSave body) {
        body.setSaveId("SV" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSave saved = pmSaveRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public PmSaveDto update(String id, PmSave body) {
        PmSave entity = pmSaveRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "saveId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSave saved = pmSaveRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        PmSave entity = pmSaveRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pmSaveRepository.delete(entity);
        em.flush();
        if (pmSaveRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PmSave> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSaveId() != null)
            .map(PmSave::getSaveId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSaveRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PmSave row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getSaveId(), "saveId must not be null");
            PmSave entity = pmSaveRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "saveId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmSaveRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PmSave row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setSaveId("SV" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSaveRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
