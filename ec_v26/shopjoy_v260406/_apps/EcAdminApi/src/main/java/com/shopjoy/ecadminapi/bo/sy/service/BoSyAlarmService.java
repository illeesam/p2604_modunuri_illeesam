package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAlarmMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
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
public class BoSyAlarmService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyAlarmMapper syAlarmMapper;
    private final SyAlarmRepository syAlarmRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyAlarmDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syAlarmMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyAlarmDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syAlarmMapper.selectPageList(p), syAlarmMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyAlarmDto getById(String id) {
        SyAlarmDto dto = syAlarmMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyAlarm create(SyAlarm body) {
        body.setAlarmId("AL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public SyAlarmDto update(String id, SyAlarm body) {
        SyAlarm entity = syAlarmRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "alarmId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyAlarm entity = syAlarmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syAlarmRepository.delete(entity);
        em.flush();
        if (syAlarmRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    @Transactional
    public void saveList(List<SyAlarm> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAlarmId() != null)
            .map(SyAlarm::getAlarmId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAlarmRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyAlarm> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAlarmId() != null)
            .toList();
        for (SyAlarm row : updateRows) {
            SyAlarm entity = syAlarmRepository.findById(row.getAlarmId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getAlarmId()));
            VoUtil.voCopyExclude(row, entity, "alarmId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syAlarmRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyAlarm> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAlarm row : insertRows) {
            row.setAlarmId("AL" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syAlarmRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}