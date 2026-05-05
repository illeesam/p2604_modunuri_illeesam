package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
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
public class BoSyAttachService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyAttachMapper syAttachMapper;
    private final SyAttachRepository syAttachRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyAttachDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syAttachMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyAttachDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syAttachMapper.selectPageList(p), syAttachMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyAttachDto getById(String id) {
        SyAttachDto dto = syAttachMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyAttach create(SyAttach body) {
        body.setAttachId("AT" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public SyAttachDto update(String id, SyAttach body) {
        SyAttach entity = syAttachRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "attachId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyAttach entity = syAttachRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syAttachRepository.delete(entity);
        em.flush();
        if (syAttachRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    @Transactional
    public void saveList(List<SyAttach> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAttachId() != null)
            .map(SyAttach::getAttachId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAttachRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyAttach> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAttachId() != null)
            .toList();
        for (SyAttach row : updateRows) {
            SyAttach entity = syAttachRepository.findById(row.getAttachId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getAttachId()));
            VoUtil.voCopyExclude(row, entity, "attachId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syAttachRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyAttach> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAttach row : insertRows) {
            row.setAttachId("AT" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syAttachRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}