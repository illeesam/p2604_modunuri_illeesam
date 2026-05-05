package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
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
public class BoPmEventService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PmEventMapper pmEventMapper;
    private final PmEventRepository pmEventRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<PmEventDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pmEventMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmEventDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmEventMapper.selectPageList(p), pmEventMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public PmEventDto getById(String id) {
        PmEventDto dto = pmEventMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PmEvent create(PmEvent body) {
        if (body.getEventStatusCd() == null) body.setEventStatusCd("DRAFT");
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setEventId("EV" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public PmEventDto update(String id, PmEvent body) {
        PmEvent entity = pmEventRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "eventId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        PmEvent entity = pmEventRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pmEventRepository.delete(entity);
        em.flush();
        if (pmEventRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public PmEventDto changeStatus(String id, String statusCd) {
        PmEvent entity = pmEventRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setEventStatusCdBefore(entity.getEventStatusCd());
        entity.setEventStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }
    @Transactional
    public void saveList(List<PmEvent> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getEventId() != null)
            .map(PmEvent::getEventId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmEventRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PmEvent row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getEventId(), "eventId must not be null");
            PmEvent entity = pmEventRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "eventId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmEventRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PmEvent row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setEventId("EV" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmEventRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
